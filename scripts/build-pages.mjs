/**
 * Build for GitHub Pages project URL (/sites-artisans/).
 * Sets VITE_PUBLIC_BASE so image/public URLs are correct at build time,
 * then rewrites router basename / asset paths in the static output.
 */
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const env = {
  ...process.env,
  VITE_PUBLIC_BASE: "/sites-artisans/",
};

const build = spawnSync("npx", ["react-router", "build"], {
  stdio: "inherit",
  env,
  shell: true,
  cwd: process.cwd(),
});

if (build.status !== 0) process.exit(build.status ?? 1);

const prepare = spawnSync(process.execPath, [join("scripts", "prepare-gh-pages.mjs")], {
  stdio: "inherit",
  env,
  cwd: process.cwd(),
});

process.exit(prepare.status ?? 1);
