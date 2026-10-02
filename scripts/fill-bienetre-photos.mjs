/**
 * Complète / remplace uniquement les photos trop légères (< 180 Ko)
 * et ajoute service_1…5 pour le métier bienetre — sans écraser
 * les grosses photos déjà choisies à la main.
 */
import { writeFileSync, readFileSync, readdirSync, statSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const slug = "bienetre";
const dir = join(process.cwd(), "public", "img", slug);
mkdirSync(dir, { recursive: true });

/** IDs Unsplash (qualité correcte) pour les slots à (re)remplir */
const FILL = {
  // réalisations (avance_3…8 / pro_4…9 / essentiel_3…5)
  avance_3: "1600334129128-685c5582fd35", // pierres chaudes
  avance_4: "1570172619644-dfd03ed5d881", // soin visage
  avance_5: "1515377905703-c4788e51af15", // forfait mariée / ambiance
  avance_6: "1515377905703-c4788e51af15", // ambiance soin / réflexologie
  avance_7: "1495474472287-4d71bcdd2085", // gommage / scrub
  avance_8: "1544367567-0f2fcb009e0b", // relaxation groupe
  // pro avant/après + petits fichiers
  pro_2: "1503387762-592deb58ef4e",
  pro_3: "1600334129128-685c5582fd35",
  pro_5: "1570172619644-dfd03ed5d881",
  pro_9: "1544367567-0f2fcb009e0b",
  // services Pro (distincts des réalisations)
  service_1: "1540555700478-4be289fbecef", // massage relaxant / spa
  service_2: "1487412720507-e7ab37603c6f", // soin visage
  service_3: "1515377905703-c4788e51af15", // épilation / cabine
  service_4: "1487412720507-e7ab37603c6f", // manucure / soin (proche)
  service_5: "1600334129128-685c5582fd35", // duo / massage
};

// fallbacks if manicure id fails
const SERVICE_FALLBACKS = {
  service_4: "1570172619644-dfd03ed5d881",
  service_5: "1600334129128-685c5582fd35",
  avance_5: "1515377905703-c4788e51af15",
};

const aliases = {
  // même photo conceptuelle partagée entre offres
  essentiel_3: "avance_3",
  essentiel_4: "avance_4",
  essentiel_5: "avance_5",
  pro_4: "avance_3",
  pro_5: "avance_4",
  pro_6: "avance_5",
  pro_7: "avance_6",
  pro_8: "avance_7",
  pro_9: "avance_8",
};

function url(id) {
  return `https://images.unsplash.com/photo-${id}?w=1600&q=85&auto=format&fit=crop&fm=jpg`;
}

const cache = new Map();
async function getBuf(id) {
  if (cache.has(id)) return cache.get(id);
  try {
    const res = await fetch(url(id), { headers: { "User-Agent": "sites-artisans-demo/3.0" } });
    if (!res.ok || !(res.headers.get("content-type") || "").includes("image")) {
      cache.set(id, null);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    cache.set(id, buf);
    return buf;
  } catch {
    cache.set(id, null);
    return null;
  }
}

async function resolveId(name, preferred) {
  let buf = await getBuf(preferred);
  if (buf) return { id: preferred, buf };
  const fb = SERVICE_FALLBACKS[name];
  if (fb) {
    buf = await getBuf(fb);
    if (buf) return { id: fb, buf };
  }
  return null;
}

const MIN = 180_000; // ne pas écraser les fichiers déjà lourds (choix manuels)

async function ensureFile(name, id) {
  const path = join(dir, `${name}.jpg`);
  const exists = existsSync(path);
  const size = exists ? statSync(path).size : 0;
  if (exists && size >= MIN && !name.startsWith("service_")) {
    console.log("keep", name, size);
    return;
  }
  // always (re)write missing/small service_* and small legacy files
  const got = await resolveId(name, id);
  if (!got) {
    console.error("FAIL", name, id);
    return;
  }
  writeFileSync(path, got.buf);
  console.log("write", name, got.buf.length, got.id);
}

// primary fills
for (const [name, id] of Object.entries(FILL)) {
  await ensureFile(name, id);
}

// sync aliases from avance_* when alias file is small/missing
for (const [alias, source] of Object.entries(aliases)) {
  const srcPath = join(dir, `${source}.jpg`);
  const aliasPath = join(dir, `${alias}.jpg`);
  if (!existsSync(srcPath)) continue;
  const srcSize = statSync(srcPath).size;
  const aliasSize = existsSync(aliasPath) ? statSync(aliasPath).size : 0;
  if (aliasSize >= MIN && aliasSize >= srcSize * 0.8) {
    console.log("keep-alias", alias, aliasSize);
    continue;
  }
  writeFileSync(aliasPath, readFileSync(srcPath));
  console.log("sync", alias, "←", source);
}

const guide = `# Photos — bienetre

## Important
- Les **pastilles de filtre** (anti-âge, mariage…) ne sont **pas** des photos : ce sont des thèmes.
- Il y a **6 réalisations** → fichiers \`avance_3\` … \`avance_8\` (et copies Essentiel / Pro).
- En Pro, les **services** ont leurs propres fichiers \`service_1\` … \`service_5\` (pas les mêmes que les réalisations).

## Essentiel (page unique)
| Fichier | Contenu |
|---|---|
| essentiel_1.jpg | Hero |
| essentiel_2.jpg | À propos |
| essentiel_3.jpg | Réalisation 1 — Massage pierres chaudes |
| essentiel_4.jpg | Réalisation 2 — Soin anti-âge visage |
| essentiel_5.jpg | Réalisation 3 — Forfait mariée |

## Avancé
| Fichier | Contenu |
|---|---|
| avance_1.jpg | Hero |
| avance_2.jpg | Image secondaire |
| avance_3.jpg | Réalisation 1 — Massage pierres chaudes |
| avance_4.jpg | Réalisation 2 — Soin anti-âge visage |
| avance_5.jpg | Réalisation 3 — Forfait mariée |
| avance_6.jpg | Réalisation 4 — Réflexologie plantaire |
| avance_7.jpg | Réalisation 5 — Gommage corps |
| avance_8.jpg | Réalisation 6 — Atelier relaxation entreprise |

## Pro
| Fichier | Contenu |
|---|---|
| pro_1.jpg | Hero |
| pro_2.jpg | Avant (projet 1) |
| pro_3.jpg | Après (projet 1) |
| pro_4.jpg | Réalisation 1 |
| pro_5.jpg | Réalisation 2 |
| pro_6.jpg | Réalisation 3 |
| pro_7.jpg | Réalisation 4 |
| pro_8.jpg | Réalisation 5 |
| pro_9.jpg | Réalisation 6 |
| **service_1.jpg** | Service — Massage relaxant |
| **service_2.jpg** | Service — Soin visage |
| **service_3.jpg** | Service — Épilation |
| **service_4.jpg** | Service — Manucure |
| **service_5.jpg** | Service — Rituel duo |

Remplace n’importe quel JPG en **gardant le même nom**. Préfère des images ≥ 1200 px de large (Unsplash : bouton Download).
`;

writeFileSync(join(dir, "GUIDE.md"), guide);
writeFileSync(
  join(process.cwd(), "public", "img", "GUIDE.md"),
  `# Photos démos — guide

## Nommage par métier (\`public/img/{métier}/\`)

| Fichiers | Rôle |
|---|---|
| \`essentiel_1\` … \`essentiel_5\` | Hero, à propos, 3 réalisations |
| \`avance_1\` … \`avance_8\` | Hero, secondaire, **6 réalisations** |
| \`pro_1\` … \`pro_9\` | Hero, avant/après, 6 réalisations |
| \`service_1\` … \`service_5\` | **Services Pro uniquement** (pas les réalisations) |

Les pastilles de filtre sur « Réalisations » sont des **thèmes**, pas une photo chacune.

Voir aussi le \`GUIDE.md\` dans chaque dossier métier (ex. \`bienetre/GUIDE.md\`).

## Qualité Unsplash
1. Ouvre la photo sur unsplash.com  
2. Download **grande taille** (pas la miniature du navigateur)  
3. Renomme en \`avance_3.jpg\` etc. et remplace le fichier  
`,
);

console.log("files", readdirSync(dir).filter((f) => f.endsWith(".jpg")).length);
