/**
 * Tailwind CSS v4 PostCSS entry point with a Node `fs` scanning fallback.
 *
 * Why this exists
 * ---------------
 * `@tailwindcss/postcss` finds class candidates by asking `@tailwindcss/oxide`
 * to walk the project with a native Rust binary. When that binary is blocked
 * (Windows Smart App Control / WDAC: "An Application Control policy has blocked
 * this file"), oxide falls back to its WebAssembly build — but the WASI build
 * cannot enumerate directories, so `Scanner.scan()` returns zero files and
 * Tailwind emits no utilities at all.
 *
 * This module keeps the stock plugin and its caching/incremental behaviour, and
 * only replaces the broken parts of the scanner: file discovery and file
 * reading are done with Node's `fs`, while candidate extraction still runs
 * through oxide's own `scanFiles()` (which works in the WASI build).
 *
 * If the native binding loads normally, nothing is patched.
 *
 * It lives in its own folder (and is linked into `node_modules` via a `file:`
 * dependency) so that Next/Turbopack treats it as a package instead of bundling
 * its dependencies — bundling `lightningcss`/WASI breaks on their dynamic
 * `require`s.
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const tailwindPostcss = require("@tailwindcss/postcss");

let oxide = null;
try {
  oxide = require("@tailwindcss/oxide");
} catch {
  // The stock plugin will surface the real error when it runs.
}

/**
 * The native binding always ends up in the require cache under a
 * `tailwindcss-oxide.*.node` path; the WebAssembly fallback never does.
 */
function nativeBindingWorks() {
  return Object.keys(require.cache).some(
    (key) => key.includes("tailwindcss-oxide") && key.endsWith(".node"),
  );
}

const IGNORED_DIRS = new Set([
  ".git",
  ".next",
  ".turbo",
  ".vercel",
  ".cache",
  ".idea",
  ".vscode",
  "node_modules",
  "bower_components",
  "dist",
  "build",
  "out",
  "coverage",
  "vendor",
]);

const SOURCE_EXTENSIONS = new Set([
  "astro", "cjs", "cshtml", "css", "cts", "eex", "elm", "erb", "ex", "exs",
  "go", "hbs", "haml", "handlebars", "heex", "html", "htm", "js", "jsx",
  "json", "liquid", "md", "mdx", "mjs", "mts", "njk", "php", "py", "rb",
  "razor", "rs", "sass", "scss", "slim", "styl", "svelte", "svg", "ts",
  "tsx", "twig", "txt", "vue",
]);

const MAX_FILE_BYTES = 1024 * 1024;

function toPosix(value) {
  return value.replace(/\\/g, "/");
}

function escapeRegExp(character) {
  return /[.*+?^${}()|[\]\\]/.test(character) ? `\\${character}` : character;
}

/** Convert a Tailwind/glob-like source pattern into an anchored RegExp. */
function globToRegExp(pattern) {
  const source = toPosix(pattern).replace(/^\.\//, "");
  let out = "^";
  let i = 0;

  while (i < source.length) {
    const character = source[i];

    if (character === "*") {
      if (source[i + 1] === "*") {
        i += 2;
        if (source[i] === "/") {
          i += 1;
          out += "(?:.*/)?";
        } else {
          out += ".*";
        }
      } else {
        i += 1;
        out += "[^/]*";
      }
      continue;
    }

    if (character === "?") {
      i += 1;
      out += "[^/]";
      continue;
    }

    if (character === "{") {
      const end = source.indexOf("}", i);
      if (end !== -1) {
        const options = source.slice(i + 1, end).split(",");
        out += `(?:${options.map((option) => option.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")).join("|")})`;
        i = end + 1;
        continue;
      }
    }

    out += escapeRegExp(character);
    i += 1;
  }

  out += "$";
  return new RegExp(out);
}

function walkFiles(directory, visit) {
  let entries;
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;

    const absolute = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) walkFiles(absolute, visit);
      continue;
    }

    if (!entry.isFile()) continue;

    const extension = path.extname(entry.name).slice(1).toLowerCase();
    if (!SOURCE_EXTENSIONS.has(extension)) continue;

    visit(absolute, extension);
  }
}

/**
 * Replace the filesystem-dependent parts of oxide's Scanner. Everything else
 * (candidate parsing, CSS generation) is still handled by oxide.
 */
function patchScanner() {
  const Base = oxide.Scanner;
  if (!Base || Base.__nodeFsScanner) return;

  const nativeScanFiles = Base.prototype.scanFiles;

  class NodeFsScanner extends Base {
    constructor(options) {
      // Pass no sources: the WASI build cannot normalise globs either.
      super({ sources: [] });
      this.__sources = options?.sources ?? [];
      this.__files = null;
      this.__candidates = [];
      this.__signature = null;
    }

    get files() {
      if (this.__files === null) this.__discover();
      return this.__files ?? [];
    }

    get globs() {
      return this.__sources
        .filter((source) => source && !source.negated)
        .map(({ base, pattern }) => ({ base, pattern }));
    }

    get normalizedSources() {
      return this.__sources;
    }

    scan() {
      // Re-walk on every scan so newly added/removed files are noticed during
      // `next dev`; the signature check below still avoids redundant parsing.
      this.__files = null;
      const files = this.files;
      const signature = files
        .map((file) => {
          try {
            const stats = fs.statSync(file);
            return `${file}:${stats.mtimeMs}:${stats.size}`;
          } catch {
            return `${file}:missing`;
          }
        })
        .join("|");

      if (signature === this.__signature) return this.__candidates;

      const contents = [];
      for (const file of files) {
        try {
          contents.push({
            content: fs.readFileSync(file, "utf8"),
            extension: path.extname(file).slice(1).toLowerCase() || "txt",
          });
        } catch {
          // Unreadable file: skip it rather than failing the whole build.
        }
      }

      let candidates;
      try {
        candidates = nativeScanFiles.call(this, contents);
      } catch {
        // Fall back to one file at a time so a single bad file can't break the scan.
        candidates = [];
        for (const entry of contents) {
          try {
            candidates.push(...nativeScanFiles.call(this, [entry]));
          } catch {
            // ignore
          }
        }
      }

      this.__signature = signature;
      this.__candidates = [...new Set(candidates)];
      return this.__candidates;
    }

    __discover() {
      const positives = new Set();
      const negatives = [];

      for (const source of this.__sources) {
        if (!source || typeof source.base !== "string" || typeof source.pattern !== "string") continue;
        if (source.negated) negatives.push(source);
      }

      if (negatives.length === 0) {
        for (const source of this.__sources) {
          if (!source || source.negated || typeof source.base !== "string" || typeof source.pattern !== "string") continue;
          const base = path.resolve(source.base);
          const matcher = globToRegExp(source.pattern);
          walkFiles(base, (file) => {
            if (matcher.test(toPosix(path.relative(base, file)))) positives.add(file);
          });
        }
      } else {
        const collected = [];
        for (const source of this.__sources) {
          if (!source || source.negated || typeof source.base !== "string" || typeof source.pattern !== "string") continue;
          const base = path.resolve(source.base);
          const matcher = globToRegExp(source.pattern);
          walkFiles(base, (file) => {
            if (matcher.test(toPosix(path.relative(base, file)))) collected.push({ file, base });
          });
        }

        const negativeMatchers = negatives.map((source) => ({
          base: path.resolve(source.base),
          matcher: globToRegExp(source.pattern),
        }));

        for (const { file, base } of collected) {
          const excluded = negativeMatchers.some(
            ({ base: negativeBase, matcher }) =>
              matcher.test(toPosix(path.relative(negativeBase || base, file))),
          );
          if (!excluded) positives.add(file);
        }
      }

      this.__files = [...positives].filter((file) => {
        try {
          return fs.statSync(file).size <= MAX_FILE_BYTES;
        } catch {
          return false;
        }
      });
      this.__signature = null;
    }
  }

  NodeFsScanner.__nodeFsScanner = true;
  oxide.Scanner = NodeFsScanner;
}

if (oxide && !nativeBindingWorks()) {
  try {
    patchScanner();
  } catch (error) {
    console.warn(
      `[tailwind] Could not enable the Node fs scanning fallback: ${error?.message ?? error}`,
    );
  }
}

module.exports = tailwindPostcss;
