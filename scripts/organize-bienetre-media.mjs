/**
 * Réorganise public/img/bienetre/ en modèle de référence :
 *   bienetre/{essentiel|avance|pro}/NN-role.jpg
 *
 * Règle : une photo = un seul fichier (SHA256 unique sur tout le métier).
 * Usage : node scripts/organize-bienetre-media.mjs
 */
import { createHash as cryptoHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";

const ROOT = join(process.cwd(), "public", "img", "bienetre");
const TMP = join(ROOT, "_staging");

function sha(buf) {
  return cryptoHash("sha256").update(buf).digest("hex");
}

function fileSha(path) {
  return sha(readFileSync(path));
}

async function fetchPhoto(idOrUrl) {
  const urls = idOrUrl.startsWith("http")
    ? [idOrUrl]
    : [
        `https://images.unsplash.com/photo-${idOrUrl}?w=1600&q=85&auto=format&fit=crop&fm=jpg`,
        `https://images.unsplash.com/${idOrUrl}?w=1600&q=85&auto=format&fit=crop&fm=jpg`,
      ];
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "sites-artisans-demo/3.0" },
        redirect: "follow",
      });
      const ct = res.headers.get("content-type") || "";
      if (!res.ok || !ct.includes("image")) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 40_000) continue;
      return { buf, url: url.split("?")[0], bytes: buf.length };
    } catch {
      /* try next */
    }
  }
  return null;
}

/** Slots cibles — chemins relatifs à bienetre/ */
const SLOTS = [
  // ESSENTIEL (5)
  { path: "essentiel/01-hero.jpg", role: "hero", offer: "essentiel", keepLocal: "avance_1.jpg", why: "hero large HQ" },
  { path: "essentiel/02-about.jpg", role: "about", offer: "essentiel", keepLocal: "essentiel_2.jpg", why: "institut / espace spa" },
  { path: "essentiel/03-realisation-pierres-chaudes.jpg", role: "realisation-pierres-chaudes", offer: "essentiel", keepLocal: "avance_3.jpg", why: "massage pierres" },
  { path: "essentiel/04-realisation-soin-visage.jpg", role: "realisation-soin-visage", offer: "essentiel", keepLocal: null, unsplash: "1570172619644-dfd03ed5d881", topic: "facial treatment" },
  { path: "essentiel/05-realisation-forfait-mariee.jpg", role: "realisation-forfait-mariee", offer: "essentiel", keepLocal: "avance_5.jpg", why: "forfait mariée / détente" },

  // AVANCÉ (8)
  { path: "avance/01-hero.jpg", role: "hero", offer: "avance", keepLocal: null, unsplash: "1540555700478-4be289fbecef", topic: "spa salon ambiance" },
  { path: "avance/02-about.jpg", role: "about", offer: "avance", keepLocal: "anna-keibalo-BJ7i-96glwM-unsplash.jpg", why: "cabine / soin" },
  { path: "avance/03-realisation-pierres-chaudes.jpg", role: "realisation-pierres-chaudes", offer: "avance", keepLocal: null, unsplash: "1600334129128-685c5582fd35", topic: "hot stone massage" },
  { path: "avance/04-realisation-soin-visage.jpg", role: "realisation-soin-visage", offer: "avance", keepLocal: "avance_4.jpg", why: "soin visage" },
  { path: "avance/05-realisation-forfait-mariee.jpg", role: "realisation-forfait-mariee", offer: "avance", keepLocal: null, unsplash: "1515377905703-c4788e51af15", topic: "bridal beauty skincare" },
  { path: "avance/06-realisation-reflexologie.jpg", role: "realisation-reflexologie", offer: "avance", keepLocal: "avance_6.jpg", why: "réflexologie / pieds" },
  { path: "avance/07-realisation-gommage.jpg", role: "realisation-gommage", offer: "avance", keepLocal: "avance_7.jpg", why: "gommage corps" },
  { path: "avance/08-realisation-atelier-entreprise.jpg", role: "realisation-atelier-entreprise", offer: "avance", keepLocal: "avance_8.jpg", why: "relaxation entreprise" },

  // PRO (15)
  { path: "pro/01-hero.jpg", role: "hero", offer: "pro", keepLocal: "6.jpg", why: "hero pro HQ" },
  { path: "pro/02-about.jpg", role: "about", offer: "pro", keepLocal: null, unsplash: "1544161515-4ab6ce6db874", topic: "massage therapy hands" },
  { path: "pro/03-before-pierres-chaudes.jpg", role: "before-pierres-chaudes", offer: "pro", keepLocal: null, unsplash: "1552693673-1bf958298935", topic: "spa stones before" },
  { path: "pro/04-after-pierres-chaudes.jpg", role: "after-pierres-chaudes", offer: "pro", keepLocal: null, unsplash: "1519828171753-62b0a42b3f22", topic: "relaxed spa after" },
  { path: "pro/05-realisation-pierres-chaudes.jpg", role: "realisation-pierres-chaudes", offer: "pro", keepLocal: null, unsplash: "1596755094514-f87e34085b2c", topic: "hot stones spa" },
  { path: "pro/06-realisation-soin-visage.jpg", role: "realisation-soin-visage", offer: "pro", keepLocal: "pro_6.jpg", why: "soin visage pro unique" },
  { path: "pro/07-realisation-forfait-mariee.jpg", role: "realisation-forfait-mariee", offer: "pro", keepLocal: null, unsplash: "1487412720507-e7ab37603c6f", topic: "bridal makeup beauty" },
  { path: "pro/08-realisation-reflexologie.jpg", role: "realisation-reflexologie", offer: "pro", keepLocal: null, unsplash: "1515378763541-0f4eac92d5f5", topic: "foot massage" },
  { path: "pro/09-realisation-gommage.jpg", role: "realisation-gommage", offer: "pro", keepLocal: null, unsplash: "1512290923902-b8637d05d7b0", topic: "body scrub spa salt" },
  { path: "pro/10-realisation-atelier-entreprise.jpg", role: "realisation-atelier-entreprise", offer: "pro", keepLocal: null, unsplash: "1544367567-0f2fcb009e0b", topic: "group wellness seat" },
  { path: "pro/11-service-massage-relaxant.jpg", role: "service-massage-relaxant", offer: "pro", keepLocal: "service_1.jpg", why: "massage" },
  { path: "pro/12-service-soin-visage.jpg", role: "service-soin-visage", offer: "pro", keepLocal: null, unsplash: "1515378791036-0648a3ef77b2", topic: "facial esthetician" },
  { path: "pro/13-service-epilation.jpg", role: "service-epilation", offer: "pro", keepLocal: null, unsplash: "1570172619644-dfd03ed5d881", topic: "legs waxing beauty (alt facial if fail)" },
  { path: "pro/14-service-manucure.jpg", role: "service-manucure", offer: "pro", keepLocal: null, unsplash: "1604654894610-df63bc536371", topic: "manicure nails" },
  { path: "pro/15-service-rituel-duo.jpg", role: "service-rituel-duo", offer: "pro", keepLocal: null, unsplash: "1540555700478-4be289fbecef", topic: "duo spa candles" },
];

/** Pool de secours Unsplash (IDs classiques free) — spa / beauté / institut */
const FALLBACK_POOL = [
  "1540555700478-4be289fbecef",
  "1600334129128-685c5582fd35",
  "1570172619644-dfd03ed5d881",
  "1515377905703-c4788e51af15",
  "1544161515-4ab6ce6db874",
  "1552693673-1bf958298935",
  "1487412720507-e7ab37603c6f",
  "1544367567-0f2fcb009e0b",
  "1512290923902-b8637d05d7b0",
  "1604654894610-df63bc536371",
  "1596755094514-f87e34085b2c",
  "1515378791036-0648a3ef77b2",
  "1522335789203-aabd1fc54bc9",
  "1570172619644-dfd03ed5d881",
  "1560750588-73207b1ef5b6",
  "1515377905703-c4788e51af15",
  "1470252649377-7e3e3c0e0e0e",
  "1507652313519-d4e9174996dd",
  "1522338140262-f46f5913618a",
  "1516975080664-ed2fc6a32937",
  "1570172619644-dfd03ed5d881",
  "1616394584738-fc6e612e71b9",
  "1570172619644-dfd03ed5d881",
  "1519823551276-062b8c9f9e3d",
  "1598440947619-2ff3ad284b26",
  "1515377905703-c4788e51af15",
  "1600334247923-cc44378e1e8d",
  "1556228578-0d85b1a4d571",
  "1570172619644-dfd03ed5d881",
  "1522337660859-02fbefca4702",
  "1515378791036-0648a3ef77b2",
  "1580618672591-eb180b1a862f",
  "1522335789203-aabd1fc54bc9",
  "1596755094514-f87e34085b2c",
  "1515377905703-c4788e51af15",
  "1600334129128-685c5582fd35",
  "1540555700478-4be289fbecef",
  "1487412947147-5cebf100ffc2",
  "1522337360788-8b1717e44e09",
  "1512496015851-a90fb38ba796",
  "1570172619644-dfd03ed5d881",
  "1556228720-195a672e8a03",
  "1515377905703-c4788e51af15",
  "1604654894610-df63bc536371",
  "1632345031435-092e439ac543",
  "1604654894610-df63bc536371",
  "1522338140262-f46f5913618a",
  "1512290923902-b8637d05d7b0",
  "1598440947619-2ff3ad284b26",
  "1556228578-8f8e9b5e5e5e",
  "1515378791036-0648a3ef77b2",
  "1600334247923-cc44378e1e8d",
  "1540555700478-4be289fbecef",
  // newer slug-style (images.unsplash.com/{id})
  "photo-1544161515-4ab6ce6db874",
  "photo-1556228720-195a672e8a03",
  "photo-1522335789203-aabd1fc54bc9",
  "photo-1616394584738-fc6e612e71b9",
  "photo-1632345031435-092e439ac543",
  "photo-1604654894610-df63bc536371",
  "photo-1516975080664-ed2fc6a32937",
  "photo-1522337360788-8b1717e44e09",
  "photo-1512496015851-a90fb38ba796",
  "photo-1580618672591-eb180b1a862f",
  "photo-1552693673-1bf958298935",
  "photo-1560750588-73207b1ef5b6",
  "photo-1598440947619-2ff3ad284b26",
  "photo-1522338140262-f46f5913618a",
  "photo-1515378791036-0648a3ef77b2",
];

const usedHashes = new Set();
const sources = [];
const report = { kept: [], downloaded: [], failed: [], replaced: [] };

mkdirSync(TMP, { recursive: true });

function claimBuf(buf, meta) {
  const h = sha(buf);
  if (usedHashes.has(h)) return false;
  usedHashes.add(h);
  const out = join(TMP, meta.path);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, buf);
  sources.push({
    file: `bienetre/${meta.path}`,
    offer: meta.offer,
    role: meta.role,
    ...meta.source,
  });
  return true;
}

async function claimFromPool(meta, preferredIds = []) {
  const tryIds = [...preferredIds, ...FALLBACK_POOL];
  for (const id of tryIds) {
    const got = await fetchPhoto(id);
    if (!got) continue;
    const ok = claimBuf(got.buf, {
      ...meta,
      source: {
        origin: "Unsplash",
        unsplashId: id.replace(/^photo-/, ""),
        unsplashUrl: `https://unsplash.com/photos/${id.replace(/^photo-/, "")}`,
        downloadUrl: got.url,
        bytes: got.bytes,
      },
    });
    if (ok) {
      report.downloaded.push({ path: meta.path, id, bytes: got.bytes });
      console.log("DL", meta.path, id, got.bytes);
      return true;
    }
  }
  report.failed.push(meta.path);
  console.error("FAIL", meta.path);
  return false;
}

// Phase 1: assign keepLocal (unique files only once)
const localClaimed = new Set();
for (const slot of SLOTS) {
  if (!slot.keepLocal) continue;
  const src = join(ROOT, slot.keepLocal);
  if (!existsSync(src)) {
    console.warn("missing local", slot.keepLocal, "→ will download");
    slot.keepLocal = null;
    continue;
  }
  if (localClaimed.has(slot.keepLocal)) {
    console.warn("local already claimed", slot.keepLocal);
    slot.keepLocal = null;
    continue;
  }
  const buf = readFileSync(src);
  const h = sha(buf);
  if (usedHashes.has(h)) {
    console.warn("hash already used for", slot.keepLocal);
    slot.keepLocal = null;
    continue;
  }
  localClaimed.add(slot.keepLocal);
  claimBuf(buf, {
    ...slot,
    source: {
      origin: "local-kept",
      previousFile: slot.keepLocal,
      bytes: buf.length,
      note: slot.why || "",
    },
  });
  report.kept.push({ path: slot.path, from: slot.keepLocal, bytes: buf.length });
  console.log("KEEP", slot.path, "←", slot.keepLocal);
}

// Phase 2: download for remaining slots
for (const slot of SLOTS) {
  const staged = join(TMP, slot.path);
  if (existsSync(staged)) continue;
  const preferred = slot.unsplash ? [slot.unsplash] : [];
  await claimFromPool(slot, preferred);
}

// Phase 3: promote staging → final folders, remove legacy flat files
for (const offer of ["essentiel", "avance", "pro"]) {
  mkdirSync(join(ROOT, offer), { recursive: true });
}

for (const slot of SLOTS) {
  const staged = join(TMP, slot.path);
  if (!existsSync(staged)) continue;
  const dest = join(ROOT, slot.path);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, readFileSync(staged));
}

// Remove legacy flat JPGs + orphan named files (keep GUIDE / SOURCES)
const keepNames = new Set(["GUIDE.md", "SOURCES.json", "SOURCES.md"]);
for (const name of readdirSync(ROOT)) {
  const full = join(ROOT, name);
  const st = statSync(full);
  if (st.isDirectory()) {
    if (["essentiel", "avance", "pro"].includes(name)) continue;
    if (name === "_staging") {
      rmSync(full, { recursive: true, force: true });
      continue;
    }
    continue;
  }
  if (keepNames.has(name)) continue;
  if (/\.(jpe?g|png|webp)$/i.test(name)) {
    rmSync(full, { force: true });
    console.log("rm legacy", name);
  }
}

rmSync(TMP, { recursive: true, force: true });

// Write SOURCES.json (central metadata)
writeFileSync(join(ROOT, "SOURCES.json"), JSON.stringify({ updatedAt: new Date().toISOString(), images: sources }, null, 2));

const sourcesMd = [
  "# Sources images — bienetre",
  "",
  "Métadonnées centralisées pour le modèle de référence Bien-être.",
  "",
  "| Fichier | Offre | Rôle | Origine | URL Unsplash |",
  "|---|---|---|---|---|",
  ...sources.map((s) => {
    const url = s.unsplashUrl || s.previousFile || "—";
    return `| \`${s.file}\` | ${s.offer} | ${s.role} | ${s.origin} | ${url} |`;
  }),
  "",
].join("\n");
writeFileSync(join(ROOT, "SOURCES.md"), sourcesMd);

const guide = `# Photos — bienetre (modèle de référence)

## Structure

\`\`\`
public/img/bienetre/
├── essentiel/
├── avance/
├── pro/
├── GUIDE.md
├── SOURCES.md
└── SOURCES.json
\`\`\`

## Convention

\`NN-role-description.jpg\` — minuscules, tirets, sans accent.

## Règle absolue

**Aucune photo ne doit être répétée** entre Essentiel, Avancé et Pro, ni à l’intérieur d’une offre.

Voir \`SOURCES.json\` pour l’origine de chaque fichier.
`;
writeFileSync(join(ROOT, "GUIDE.md"), guide);

// Final hash audit
const allJpgs = [];
for (const offer of ["essentiel", "avance", "pro"]) {
  const d = join(ROOT, offer);
  for (const f of readdirSync(d).filter((x) => x.endsWith(".jpg"))) {
    allJpgs.push(join(d, f));
  }
}
const hashMap = new Map();
for (const p of allJpgs) {
  const h = fileSha(p);
  if (!hashMap.has(h)) hashMap.set(h, []);
  hashMap.get(h).push(p.replace(ROOT + "\\", "").replace(ROOT + "/", ""));
}
const dups = [...hashMap.entries()].filter(([, list]) => list.length > 1);

console.log("\n=== AUDIT ===");
console.log("files", allJpgs.length);
console.log("unique hashes", hashMap.size);
console.log("duplicates", dups.length);
for (const [, list] of dups) console.log(" DUP", list.join(" | "));
console.log("failed slots", report.failed);
writeFileSync(join(ROOT, "_audit.json"), JSON.stringify({ report, dups, unique: hashMap.size, files: allJpgs.length }, null, 2));
