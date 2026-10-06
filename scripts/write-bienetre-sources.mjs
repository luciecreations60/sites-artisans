import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "public", "img", "bienetre");
const images = [];

for (const offer of ["essentiel", "avance", "pro"]) {
  const files = readdirSync(join(root, offer))
    .filter((f) => f.endsWith(".jpg"))
    .sort();
  for (const f of files) {
    const rel = `${offer}/${f}`;
    const buf = readFileSync(join(root, rel));
    const role = f.replace(/^\d+-/, "").replace(/\.jpg$/, "");
    images.push({
      file: `bienetre/${rel}`,
      offer,
      role,
      bytes: buf.length,
      sha256: createHash("sha256").update(buf).digest("hex"),
    });
  }
}

const known = {
  "bienetre/essentiel/01-hero.jpg": {
    unsplashUrl: "https://unsplash.com/photos/oAvwAKFiU7Q",
    photographer: "Jakub Klucký",
  },
  "bienetre/essentiel/03-realisation-pierres-chaudes.jpg": {
    unsplashUrl: "https://unsplash.com/photos/1600334129128-685c5582fd35",
  },
  "bienetre/essentiel/04-realisation-soin-visage.jpg": {
    unsplashUrl: "https://unsplash.com/photos/tHogec0-_KE",
  },
  "bienetre/avance/01-hero.jpg": {
    unsplashUrl: "https://unsplash.com/photos/JGIfuL-nzCE",
  },
  "bienetre/avance/02-about.jpg": {
    unsplashUrl: "https://unsplash.com/photos/BJ7i-96glwM",
    photographer: "Anna Keibalo",
  },
  "bienetre/avance/03-realisation-pierres-chaudes.jpg": {
    unsplashUrl: "https://unsplash.com/photos/1544161515-4ab6ce6db874",
  },
  "bienetre/avance/04-realisation-soin-visage.jpg": {
    unsplashUrl: "https://unsplash.com/photos/1570172619644-dfd03ed5d881",
  },
  "bienetre/avance/05-realisation-forfait-mariee.jpg": {
    unsplashUrl: "https://unsplash.com/photos/1512496015851-a90fb38ba796",
  },
  "bienetre/pro/01-hero.jpg": {
    unsplashUrl: "https://unsplash.com/photos/If_OWC3KAds",
    photographer: "iKshana Productions",
  },
  "bienetre/pro/02-about.jpg": {
    unsplashUrl: "https://unsplash.com/photos/kygrWmp-GdE",
  },
  "bienetre/pro/03-before-pierres-chaudes.jpg": {
    unsplashUrl: "https://unsplash.com/photos/9qYFu1NzpS8",
  },
  "bienetre/pro/04-after-pierres-chaudes.jpg": {
    unsplashUrl: "https://unsplash.com/photos/1540555700478-4be289fbecef",
  },
  "bienetre/pro/05-realisation-pierres-chaudes.jpg": {
    unsplashUrl: "https://unsplash.com/photos/7yeqemd-p90",
    note: "Massage dos — alternative (évite doublon pierres HQ Essentiel)",
  },
  "bienetre/pro/07-realisation-forfait-mariee.jpg": {
    unsplashUrl: "https://unsplash.com/photos/1487412947147-5cebf100ffc2",
  },
  "bienetre/pro/08-realisation-reflexologie.jpg": {
    unsplashUrl: "https://unsplash.com/photos/N1hQ-rLyJHI",
  },
  "bienetre/pro/09-realisation-gommage.jpg": {
    unsplashUrl: "https://unsplash.com/photos/4pDlorrrOOM",
  },
  "bienetre/pro/10-realisation-atelier-entreprise.jpg": {
    unsplashUrl: "https://unsplash.com/photos/1506126613408-eca07ce68773",
  },
  "bienetre/pro/11-service-massage-relaxant.jpg": {
    unsplashUrl: "https://unsplash.com/photos/3aGV2ViCzrM",
  },
  "bienetre/pro/12-service-soin-visage.jpg": {
    unsplashUrl: "https://unsplash.com/photos/1616394584738-fc6e612e71b9",
  },
  "bienetre/pro/14-service-manucure.jpg": {
    unsplashUrl: "https://unsplash.com/photos/cuQZGL7w6h0",
  },
  "bienetre/pro/15-service-rituel-duo.jpg": {
    unsplashUrl: "https://unsplash.com/photos/VWELT4w5jj8",
    note: "Massage cabine — idéal duo couple à remplacer si dispo",
  },
};

for (const img of images) {
  Object.assign(img, known[img.file] || {});
  img.origin = img.unsplashUrl ? "Unsplash" : "local-kept";
}

const unique = new Set(images.map((i) => i.sha256));
writeFileSync(
  join(root, "SOURCES.json"),
  JSON.stringify(
    {
      updatedAt: new Date().toISOString(),
      duplicateCheck: { files: images.length, uniqueHashes: unique.size },
      images,
    },
    null,
    2,
  ),
);

const md = [
  "# Sources images — bienetre",
  "",
  "Modèle de référence pour l’organisation des images des démos.",
  "",
  `| Fichiers | Hashes uniques |`,
  `|---|---|`,
  `| ${images.length} | ${unique.size} |`,
  "",
  "| Fichier | Offre | Rôle | Origine | URL Unsplash |",
  "|---|---|---|---|---|",
  ...images.map(
    (i) =>
      `| \`${i.file}\` | ${i.offer} | ${i.role} | ${i.origin} | ${i.unsplashUrl || "—"} |`,
  ),
  "",
].join("\n");
writeFileSync(join(root, "SOURCES.md"), md);

writeFileSync(
  join(root, "GUIDE.md"),
  `# Photos — bienetre (modèle de référence)

## Structure

\`\`\`
public/img/bienetre/
├── essentiel/   # 5 images
├── avance/      # 8 images
├── pro/         # 15 images (dont 5 services)
├── GUIDE.md
├── SOURCES.md
└── SOURCES.json
\`\`\`

## Convention de nommage

\`NN-role-description.jpg\` — minuscules, tirets, sans accent.

Exemples : \`01-hero.jpg\`, \`03-realisation-pierres-chaudes.jpg\`, \`11-service-massage-relaxant.jpg\`

## Règle absolue

**Aucune photo répétée** entre Essentiel, Avancé et Pro (contrôle SHA-256 dans \`SOURCES.json\`).

Voir \`SOURCES.json\` pour l’origine Unsplash de chaque fichier.
`,
);

for (const d of ["_new", "_probe", "_staging", "_final_staging"]) {
  const p = join(root, d);
  if (existsSync(p)) rmSync(p, { recursive: true, force: true });
}
for (const f of [
  "_audit.json",
  "_fix-report.json",
  "_assign-report.json",
  "_last_replacements.json",
  "_new_candidates.json",
]) {
  const p = join(root, f);
  if (existsSync(p)) rmSync(p, { force: true });
}

console.log("done", images.length, "unique", unique.size);
