import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = join(process.cwd(), "public", "img");

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.toLowerCase().endsWith(".jpg")) out.push(p);
  }
  return out;
}

const files = walk(root);
const byHash = new Map();
for (const f of files) {
  const hash = createHash("sha256").update(readFileSync(f)).digest("hex");
  if (!byHash.has(hash)) byHash.set(hash, []);
  byHash.get(hash).push(relative(process.cwd(), f).replaceAll("\\", "/"));
}

const dups = [...byHash.entries()]
  .filter(([, paths]) => paths.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

console.log(`Total JPG: ${files.length}`);
console.log(`Unique hashes: ${byHash.size}`);
console.log(`Duplicate groups: ${dups.length}`);
console.log(`Files in dups: ${dups.reduce((n, [, p]) => n + p.length, 0)}`);
console.log("\n--- TOP 12 SHARED ---");
for (const [hash, paths] of dups.slice(0, 12)) {
  console.log(`\n${hash.slice(0, 12)}… ×${paths.length}`);
  for (const p of paths) console.log(`  ${p}`);
}
