// Tailwind CSS v4 normally runs "@tailwindcss/postcss" directly, but the native
// scanner binary it depends on (@tailwindcss/oxide) is blocked on this machine
// by Windows Smart App Control. `tailwind-fs-postcss` (./tools) wraps the stock
// plugin and only replaces the broken file-scanning step with Node's `fs`, so
// utility classes are generated without the native binary. On machines where
// the native binding loads, it passes straight through to the stock plugin.
const config = {
  plugins: {
    "tailwind-fs-postcss": {},
  },
};

export default config;
