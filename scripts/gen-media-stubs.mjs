import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const TRADES_DIR = "app/data/trades";
function slugify(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36);
}
function pad(n) {
  return String(n).padStart(2, "0");
}
const SKIP = new Set(["bienetre"]);
const slugs = readdirSync(TRADES_DIR)
  .filter((f) => f.endsWith(".ts") && !f.includes("media") && f !== "_build.ts" && f !== "types.ts")
  .map((f) => f.replace(/\.ts$/, ""))
  .filter((s) => !SKIP.has(s));

for (const slug of slugs) {
  const src = readFileSync(join(TRADES_DIR, `${slug}.ts`), "utf8");
  const titlesMatch = src.match(/projectTitles:\s*\[([\s\S]*?)\],/);
  const projects = titlesMatch
    ? [...titlesMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
    : [];
  const svcBlock = src.match(/services:\s*\[([\s\S]*?)\],\s*projectTitles/);
  const services = svcBlock
    ? [...svcBlock[1].matchAll(/title:\s*"([^"]+)"/g)].map((m) => m[1]).slice(0, 5)
    : [];
  const p = projects.map(slugify);
  while (p.length < 6) p.push(`projet-${p.length + 1}`);
  const s = services.map(slugify);
  while (s.length < 5) s.push(`service-${s.length + 1}`);
  const essR = p.slice(0, 3).map((x, i) => `essentiel/${pad(3 + i)}-realisation-${x}.jpg`);
  const avR = p.map((x, i) => `avance/${pad(3 + i)}-realisation-${x}.jpg`);
  const prR = p.map((x, i) => `pro/${pad(5 + i)}-realisation-${x}.jpg`);
  const prS = s.map((x, i) => `pro/${pad(11 + i)}-service-${x}.jpg`);
  const body = `import type { TradeMediaManifest } from "./mediaTypes";

export const ${slug}Media = {
  essentiel: {
    hero: "essentiel/01-hero.jpg",
    about: "essentiel/02-about.jpg",
    realisations: ${JSON.stringify(essR)},
  },
  avance: {
    hero: "avance/01-hero.jpg",
    about: "avance/02-about.jpg",
    realisations: ${JSON.stringify(avR)},
  },
  pro: {
    hero: "pro/01-hero.jpg",
    about: "pro/02-about.jpg",
    before: "pro/03-before-${p[0]}.jpg",
    after: "pro/04-after-${p[0]}.jpg",
    realisations: ${JSON.stringify(prR)},
    services: ${JSON.stringify(prS)},
  },
} as const satisfies TradeMediaManifest;
`;
  writeFileSync(join(TRADES_DIR, `${slug}.media.ts`), body);
  console.log("wrote", `${slug}.media.ts`);
}

const imports = [
  `import type { TradeSlug } from "../types";`,
  `import type { TradeMediaManifest } from "./mediaTypes";`,
  `import { bienetreMedia } from "./bienetre.media";`,
  ...slugs.map((s) => `import { ${s}Media } from "./${s}.media";`),
].join("\n");
const entries = [`  bienetre: bienetreMedia,`, ...slugs.map((s) => `  ${s}: ${s}Media,`)].join(
  "\n",
);
writeFileSync(
  join(TRADES_DIR, "media.ts"),
  `${imports}

export const tradeMedia = {
${entries}
} as const satisfies Partial<Record<TradeSlug, TradeMediaManifest>>;

export function getTradeMedia(slug: string): TradeMediaManifest | undefined {
  return tradeMedia[slug as TradeSlug];
}
`,
);
console.log("registry ok", slugs.length);
