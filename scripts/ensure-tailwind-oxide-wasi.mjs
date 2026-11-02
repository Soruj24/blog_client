/**
 * Tailwind CSS v4 scans source files with a native Rust binary (@tailwindcss/oxide).
 * On Windows, Smart App Control (and some AppLocker/WDAC policies) block that
 * unsigned `.node` binary, which surfaces during `next dev`/`next build` as:
 *
 *   Error: An Application Control policy has blocked this file.
 *   ...@tailwindcss\oxide-win32-x64-msvc\tailwindcss-oxide.win32-x64-msvc.node
 *
 * @tailwindcss/oxide ships a WebAssembly build of the same engine as a fallback,
 * but npm refuses to install it on a x64 machine because the package declares
 * `"cpu": ["wasm32"]` (EBADPLATFORM) — so the fallback is never present.
 *
 * This postinstall hook installs that WebAssembly fallback with `--force`, but
 * only when the native binding cannot be loaded, so normal machines are untouched.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "package.json"));

const WASI_PACKAGE = "@tailwindcss/oxide-wasm32-wasi";
const GUARD_ENV = "TAILWIND_OXIDE_WASI_INSTALLING";

const log = (message) => console.log(`[ensure-tailwind-oxide-wasi] ${message}`);

// Prevent the nested `npm install --force` below from re-running this script.
if (process.env[GUARD_ENV]) {
  process.exit(0);
}

let oxideVersion;
try {
  oxideVersion = require("@tailwindcss/oxide/package.json").version;
} catch {
  // Tailwind isn't installed (or its optional deps were skipped): nothing to do.
  process.exit(0);
}

// If this succeeds, the native binding (or an already installed WASM fallback)
// loaded fine and there is nothing to fix.
try {
  require("@tailwindcss/oxide");
  process.exit(0);
} catch (error) {
  log(`native binding unavailable: ${String(error?.message ?? error).split("\n")[0]}`);
}

log(`installing ${WASI_PACKAGE}@${oxideVersion} as a WebAssembly fallback...`);

/** Locate the npm CLI script so we can run it without a shell. */
function resolveNpmCli() {
  if (process.env.npm_execpath) return process.env.npm_execpath;

  const nodeDir = path.dirname(process.execPath);
  const candidates = [
    path.join(nodeDir, "node_modules", "npm", "bin", "npm-cli.js"),
    path.join(nodeDir, "..", "lib", "node_modules", "npm", "bin", "npm-cli.js"),
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

const npmCli = resolveNpmCli();
const command = npmCli ? process.execPath : process.platform === "win32" ? "npm.cmd" : "npm";
const args = npmCli ? [npmCli] : [];
args.push(
  "install",
  "--no-save",
  "--force",
  "--no-audit",
  "--no-fund",
  `${WASI_PACKAGE}@${oxideVersion}`,
);

try {
  execFileSync(command, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, [GUARD_ENV]: "1" },
    shell: !npmCli && process.platform === "win32",
  });
} catch {
  log("could not install the fallback automatically. Run this manually:");
  log(`  npm install --no-save --force ${WASI_PACKAGE}@${oxideVersion}`);
  process.exit(0);
}

// Verify in a fresh process: this one already cached the failed native lookup.
try {
  execFileSync(process.execPath, ["-e", "require('@tailwindcss/oxide')"], {
    cwd: root,
    stdio: "ignore",
  });
  log(`WebAssembly fallback ready (${WASI_PACKAGE}@${oxideVersion}).`);
} catch {
  log(`fallback was installed but still cannot be loaded.`);
  log(`Run this manually: npm install --no-save --force ${WASI_PACKAGE}@${oxideVersion}`);
}
