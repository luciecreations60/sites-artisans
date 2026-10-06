import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const tradesDir = join(process.cwd(), "app/data/trades");
const imgRoot = join(process.cwd(), "public/img");

function slugify(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

const skip = new Set(["_build.ts", "bienetre.media.ts", "bienetre.ts"]);
const files = readdirSync(tradesDir).filter((f) => f.endsWith(".ts") && !skip.has(f));

for (const f of files) {
  const slug = f.replace(/\.ts$/, "");
  if (slug === "types") continue;
  const src = readFileSync(join(tradesDir, f), "utf8");
  const titlesMatch = src.match(/projectTitles:\s*\[([\s\S]*?)\],/);
  const titles = titlesMatch
    ? [...titlesMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
    : [];
  const services = [...src.matchAll(/title:\s*"([^"]+)"/g)].map((m) => m[1]).slice(0, 5);

  const dir = join(imgRoot, slug);
  const jpgs = existsSync(dir)
    ? readdirSync(dir).filter((x) => x.endsWith(".jpg") && statSync(join(dir, x)).isFile())
    : [];
  const hashes = new Map();
  for (const j of jpgs) {
    const h = createHash("sha256").update(readFileSync(join(dir, j))).digest("hex").slice(0, 12);
    if (!hashes.has(h)) hashes.set(h, []);
    hashes.get(h).push(j);
  }
  const dups = [...hashes.values()].filter((l) => l.length > 1);

  console.log(`\n=== ${slug} (${jpgs.length} jpg, ${hashes.size} unique, ${dups.length} dup groups) ===`);
  console.log("projects:", titles.map((t, i) => `${i + 1}:${slugify(t)}`).join(" | "));
  console.log("services:", services.map((t, i) => `${i + 1}:${slugify(t)}`).join(" | "));
  if (dups.length) {
    for (const g of dups) console.log("  DUP", g.join(", "));
  }
}
