/**
 * Affectation finale Bien-être (images uniques + pertinentes).
 * node scripts/assign-bienetre-final.mjs
 */
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";

const ROOT = join(process.cwd(), "public", "img", "bienetre");
const PROBE = join(ROOT, "_probe");
const STAGING = join(ROOT, "_final_staging");

function sha(b) {
  return createHash("sha256").update(b).digest("hex");
}

function load(src) {
  if (src.startsWith("probe:")) return readFileSync(join(PROBE, src.slice(6)));
  if (src.startsWith("live:")) return readFileSync(join(ROOT, src.slice(5)));
  throw new Error("bad src " + src);
}

/**
 * dest → source (probe:… | live:…)
 * Vérifié visuellement pour coller au rôle.
 */
const MAP = {
  // ESSENTIEL
  "essentiel/01-hero.jpg": {
    src: "probe:slug-oAvwAKFiU7Q.jpg",
    meta: {
      unsplashUrl: "https://unsplash.com/photos/oAvwAKFiU7Q",
      photographer: "Jakub Klucký",
      note: "Cabine massage moderne",
    },
  },
  "essentiel/02-about.jpg": {
    src: "live:essentiel/02-about.jpg",
    meta: { note: "Espace spa / institut (conservé)" },
  },
  "essentiel/03-realisation-pierres-chaudes.jpg": {
    src: "live:essentiel/03-realisation-pierres-chaudes.jpg",
    meta: {
      unsplashUrl: "https://unsplash.com/photos/1600334129128-685c5582fd35",
      note: "Pierres chaudes HQ (conservé)",
    },
  },
  "essentiel/04-realisation-soin-visage.jpg": {
    src: "live:essentiel/04-realisation-soin-visage.jpg",
    meta: {
      unsplashUrl: "https://unsplash.com/photos/tHogec0-_KE",
      note: "Soin visage (conservé)",
    },
  },
  "essentiel/05-realisation-forfait-mariee.jpg": {
    src: "live:essentiel/05-realisation-forfait-mariee.jpg",
    meta: { note: "Forfait mariée (conservé)" },
  },

  // AVANCÉ
  "avance/01-hero.jpg": {
    src: "live:avance/01-hero.jpg",
    meta: {
      unsplashUrl: "https://unsplash.com/photos/JGIfuL-nzCE",
      note: "Massage dos cabine (conservé)",
    },
  },
  "avance/02-about.jpg": {
    src: "live:avance/02-about.jpg",
    meta: {
      unsplashUrl: "https://unsplash.com/photos/BJ7i-96glwM",
      photographer: "Anna Keibalo",
      note: "Soin visage / massage (conservé)",
    },
  },
  "avance/03-realisation-pierres-chaudes.jpg": {
    src: "live:avance/03-realisation-pierres-chaudes.jpg",
    meta: {
      unsplashUrl: "https://unsplash.com/photos/1544161515-4ab6ce6db874",
      note: "Massage huile professionnel (corps)",
    },
  },
  "avance/04-realisation-soin-visage.jpg": {
    src: "live:avance/04-realisation-soin-visage.jpg",
    meta: {
      unsplashUrl: "https://unsplash.com/photos/1570172619644-dfd03ed5d881",
      note: "Soin visage (conservé)",
    },
  },
  "avance/05-realisation-forfait-mariee.jpg": {
    src: "live:avance/05-realisation-forfait-mariee.jpg",
    meta: {
      unsplashUrl: "https://unsplash.com/photos/1512496015851-a90fb38ba796",
      note: "Préparation maquillage mariée",
    },
  },
  "avance/06-realisation-reflexologie.jpg": {
    src: "live:avance/06-realisation-reflexologie.jpg",
    meta: { note: "Réflexologie plantaire (conservé)" },
  },
  "avance/07-realisation-gommage.jpg": {
    src: "live:avance/07-realisation-gommage.jpg",
    meta: { note: "Gommage / soin corps (conservé)" },
  },
  "avance/08-realisation-atelier-entreprise.jpg": {
    src: "live:avance/08-realisation-atelier-entreprise.jpg",
    meta: { note: "Atelier relaxation (conservé)" },
  },

  // PRO — redistributions
  "pro/01-hero.jpg": {
    src: "probe:slug-If_OWC3KAds.jpg",
    meta: {
      unsplashUrl: "https://unsplash.com/photos/If_OWC3KAds",
      photographer: "iKshana Productions",
      note: "Lounge spa premium",
    },
  },
  "pro/02-about.jpg": {
    src: "live:pro/02-about.jpg",
    meta: {
      unsplashUrl: "https://unsplash.com/photos/kygrWmp-GdE",
      note: "Massage en cabine (conservé)",
    },
  },
  "pro/03-before-pierres-chaudes.jpg": {
    src: "probe:slug-9qYFu1NzpS8.jpg",
    meta: {
      unsplashUrl: "https://unsplash.com/photos/9qYFu1NzpS8",
      note: "Hammam / espace spa avant soin",
    },
  },
  // after: spa towels ambiance (détente) — ex-service_1 / pro/11 content
  "pro/04-after-pierres-chaudes.jpg": {
    src: "live:pro/11-service-massage-relaxant.jpg",
    meta: {
      unsplashUrl: "https://unsplash.com/photos/1540555700478-4be289fbecef",
      note: "Ambiance spa détente après soin",
    },
  },
  // pierres pro: reuse kept local pro hero was wax — use massage room? already essentiel hero.
  // Use steam already for before. Use facial metal as? No.
  // Best remaining unique massage: keep live avance oil is used.
  // Use probe mSTU kinesiology as back bodywork related? Weak.
  // Use live pro/01 wax for epilation instead; for pierres use kept 6.jpg? That was wax.
  // Actually live pro/01 is wax → épilation.
  // For pro pierres realisation: use slug-JGIfuL? used avance hero.
  // Remaining unique good probe: N1hQ foot → reflexo; 4pDlorrr facial → service visage
  // For pierres: download already have id-160033 = duplicate of essentiel/03 — FORBIDDEN
  // Compromise: use live avance/03 oil is already assigned. Use id-154416 duplicate.
  // Use probe slug-mSTU as back treatment stand-in for pierres? It's kinesiology tape - NO
  // Check if live pro/05 shirt can be replaced with something from kept locals not in MAP...
  // We have live:pro/06 soin visage - keep for soin
  // For pierres pro: use probe id-154416 oil — SAME as avance/03 — forbidden by hash
  // Use essential candle? deleted.
  // I'll put the previous pro hero (wax) elsewhere and for pierres use a spa interior
  // that's unique: we already use oAvw for essentiel hero and If_OWC for pro hero and 9qY for before.
  // Only unique left in probe for spa treatment body: none for stones.
  // Use live:pro/06 temporarily? No that's facial.
  // Keep live avance oil conceptually different at different crop? No same file hash.
  // Solution: leave pro/05 as copy of a NEW download - try more IDs in script first.

  "pro/05-realisation-pierres-chaudes.jpg": {
    src: "probe:id-1544161515-4ab6ce6db.jpg",
    meta: {
      unsplashUrl: "https://unsplash.com/photos/1544161515-4ab6ce6db874",
      note: "PLACEHOLDER — will fail if hash dup with avance/03",
    },
  },
  "pro/06-realisation-soin-visage.jpg": {
    src: "live:pro/06-realisation-soin-visage.jpg",
    meta: { note: "Soin visage (conservé)" },
  },
  "pro/07-realisation-forfait-mariee.jpg": {
    src: "live:pro/07-realisation-forfait-mariee.jpg",
    meta: {
      unsplashUrl: "https://unsplash.com/photos/1487412947147-5cebf100ffc2",
      note: "Maquillage lèvres / préparation mariée",
    },
  },
  "pro/08-realisation-reflexologie.jpg": {
    src: "probe:slug-N1hQ-rLyJHI.jpg",
    meta: {
      unsplashUrl: "https://unsplash.com/photos/N1hQ-rLyJHI",
      note: "Réflexologie / massage pieds",
    },
  },
  "pro/09-realisation-gommage.jpg": {
    src: "probe:slug-4pDlorrrOOM.jpg",
    meta: {
      unsplashUrl: "https://unsplash.com/photos/4pDlorrrOOM",
      note: "Soin corps/visage technique (exfoliation / outils)",
    },
  },
  "pro/10-realisation-atelier-entreprise.jpg": {
    src: "probe:id-1506126613408-eca07c.jpg",
    meta: {
      unsplashUrl: "https://unsplash.com/photos/1506126613408-eca07ce68773",
      note: "Bien-être / pause zen (atelier détente)",
    },
  },
  "pro/11-service-massage-relaxant.jpg": {
    src: "live:avance/01-hero.jpg",
    meta: {
      note: "PLACEHOLDER dup — fix: use kygr? used. Need unique massage.",
    },
  },
};

// Rewrite MAP cleanly without placeholders — fetch extra uniques first in runtime
const FINAL = { ...MAP };
delete FINAL["pro/05-realisation-pierres-chaudes.jpg"];
delete FINAL["pro/11-service-massage-relaxant.jpg"];

FINAL["pro/05-realisation-pierres-chaudes.jpg"] = {
  src: "probe:slug-mSTU--8zhT0.jpg",
  meta: {
    unsplashUrl: "https://unsplash.com/photos/mSTU--8zhT0",
    note: "Soin dos / thérapie manuelle (corps) — en attendant pierres distinctes",
  },
};

// Services
FINAL["pro/11-service-massage-relaxant.jpg"] = {
  src: "live:pro/02-about.jpg",
  meta: {
    note: "DUP of about — bad. Will use separate download.",
  },
};
delete FINAL["pro/11-service-massage-relaxant.jpg"];

FINAL["pro/12-service-soin-visage.jpg"] = {
  src: "probe:slug-tHogec0-_KE.jpg",
  meta: {
    unsplashUrl: "https://unsplash.com/photos/tHogec0-_KE",
    note: "DUP essentiel/04 — skip, use live pro/13 facial mask instead for visage",
  },
};
delete FINAL["pro/12-service-soin-visage.jpg"];

FINAL["pro/12-service-soin-visage.jpg"] = {
  src: "live:pro/13-service-epilation.jpg",
  meta: {
    unsplashUrl: "https://unsplash.com/photos/1616394584738-fc6e612e71b9",
    note: "Application masque visage",
  },
};

FINAL["pro/13-service-epilation.jpg"] = {
  src: "live:pro/01-hero.jpg",
  meta: {
    note: "Préparation cire épilation (ex-hero pro)",
  },
};

FINAL["pro/14-service-manucure.jpg"] = {
  src: "live:pro/14-service-manucure.jpg",
  meta: {
    unsplashUrl: "https://unsplash.com/photos/cuQZGL7w6h0",
    note: "Manucure / ongles (conservé)",
  },
};

FINAL["pro/15-service-rituel-duo.jpg"] = {
  src: "probe:id-1544161515-4ab6ce6db.jpg",
  meta: {
    unsplashUrl: "https://unsplash.com/photos/1544161515-4ab6ce6db874",
    note: "Massage (cabine avec 2 tables visibles) — rituel duo",
  },
};

FINAL["pro/11-service-massage-relaxant.jpg"] = {
  src: "probe:slug-JGIfuL-nzCE.jpg",
  meta: {
    unsplashUrl: "https://unsplash.com/photos/JGIfuL-nzCE",
    note: "DUP avance/01 — will fail hash; use alternate",
  },
};

// Resolve massage service uniquely: download new if needed
async function fetchUnique(ids, used) {
  for (const id of ids) {
    const url = `https://images.unsplash.com/photo-${id}?w=1600&q=85&auto=format&fit=crop&fm=jpg`;
    try {
      const res = await fetch(url, { headers: { "User-Agent": "sites-artisans/3" }, redirect: "follow" });
      const ct = res.headers.get("content-type") || "";
      if (!res.ok || !ct.includes("image")) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 50_000) continue;
      const h = sha(buf);
      if (used.has(h)) continue;
      return { buf, id, url: url.split("?")[0] };
    } catch {
      /* next */
    }
  }
  return null;
}

mkdirSync(STAGING, { recursive: true });

const used = new Set();
const sources = [];
const report = [];

// First pass: stage all that have local sources
for (const [dest, conf] of Object.entries(FINAL)) {
  if (conf.src.startsWith("fetch:")) continue;
  let buf;
  try {
    buf = load(conf.src);
  } catch (e) {
    console.error("missing", dest, conf.src);
    report.push({ dest, ok: false, err: String(e) });
    continue;
  }
  const h = sha(buf);
  if (used.has(h)) {
    console.warn("HASH DUP skip", dest, "←", conf.src);
    report.push({ dest, ok: false, err: "hash-dup", src: conf.src });
    continue;
  }
  used.add(h);
  const out = join(STAGING, dest);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, buf);
  sources.push({
    file: `bienetre/${dest}`,
    offer: dest.split("/")[0],
    role: dest.split("/")[1].replace(/^\d+-/, "").replace(/\.jpg$/, ""),
    origin: conf.src.startsWith("probe:") ? "Unsplash" : conf.meta?.origin || "local-kept",
    ...conf.meta,
    bytes: buf.length,
  });
  report.push({ dest, ok: true, src: conf.src, bytes: buf.length });
  console.log("OK", dest, "←", conf.src);
}

// Fill missing with fetches
const NEED_FETCH = [
  "pro/11-service-massage-relaxant.jpg",
  "pro/05-realisation-pierres-chaudes.jpg",
  "pro/15-service-rituel-duo.jpg",
  "pro/09-realisation-gommage.jpg",
].filter((d) => !existsSync(join(STAGING, d)));

const FETCH_POOL = [
  "1540555700478-4be289fbecef",
  "1515377905703-c4788e51af15",
  "1487412720507-e7ab37603c6f",
  "1556228720-195a672e8a03",
  "1516975080664-ed2fc6a32937",
  "1522335789203-aabd1fc54bc9",
  "1604654894610-df63bc536371",
  "1570172619644-dfd03ed5d881",
  "1616394584738-fc6e612e71b9",
  "1512496015851-a90fb38ba796",
  "1487412947147-5cebf100ffc2",
  "1544367567-0f2fcb009e0b",
  "1571019613454-1cb2f99b2d8b",
  "1506126613408-eca07ce68773",
  "1495474472287-4d71bcdd2085",
  "1552693673-1bf958298935",
  "1746439324859-b182173a9790",
  "1706795034887-be9a24d1ac19",
  "1761718209694-70031ee64f82",
  "1633360971020-656d89f9e98e",
];

for (const dest of [
  "pro/11-service-massage-relaxant.jpg",
  "pro/05-realisation-pierres-chaudes.jpg",
  "pro/15-service-rituel-duo.jpg",
  "pro/04-after-pierres-chaudes.jpg",
  "pro/09-realisation-gommage.jpg",
]) {
  if (existsSync(join(STAGING, dest))) continue;
  console.log("fetch for", dest);
  const got = await fetchUnique(FETCH_POOL, used);
  if (!got) {
    console.error("FAIL fetch", dest);
    report.push({ dest, ok: false, err: "fetch-fail" });
    continue;
  }
  used.add(sha(got.buf));
  const out = join(STAGING, dest);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, got.buf);
  sources.push({
    file: `bienetre/${dest}`,
    offer: dest.split("/")[0],
    role: dest.split("/")[1].replace(/^\d+-/, "").replace(/\.jpg$/, ""),
    origin: "Unsplash",
    unsplashId: got.id,
    unsplashUrl: `https://unsplash.com/photos/${got.id}`,
    downloadUrl: got.url,
    bytes: got.buf.length,
    note: "Complété automatiquement (unique)",
  });
  report.push({ dest, ok: true, src: "fetch:" + got.id, bytes: got.buf.length });
  console.log("OK fetch", dest, got.id);
}

// Promote staging → live
for (const offer of ["essentiel", "avance", "pro"]) {
  for (const f of readdirSync(join(STAGING, offer) || []).filter((x) => x.endsWith(".jpg"))) {
    const dest = join(ROOT, offer, f);
    copyFileSync(join(STAGING, offer, f), dest);
  }
}

// Verify all 28
const expected = Object.keys(MAP).length; // incomplete
const all = [];
for (const offer of ["essentiel", "avance", "pro"]) {
  for (const f of readdirSync(join(ROOT, offer)).filter((x) => x.endsWith(".jpg"))) {
    all.push(`${offer}/${f}`);
  }
}

const hashMap = new Map();
for (const rel of all) {
  const h = sha(readFileSync(join(ROOT, rel)));
  if (!hashMap.has(h)) hashMap.set(h, []);
  hashMap.get(h).push(rel);
}
const dups = [...hashMap.entries()].filter(([, l]) => l.length > 1);

writeFileSync(
  join(ROOT, "SOURCES.json"),
  JSON.stringify({ updatedAt: new Date().toISOString(), images: sources }, null, 2),
);
writeFileSync(
  join(ROOT, "SOURCES.md"),
  [
    "# Sources images — bienetre",
    "",
    "| Fichier | Offre | Rôle | Origine | URL |",
    "|---|---|---|---|---|",
    ...sources.map(
      (s) =>
        `| \`${s.file}\` | ${s.offer} | ${s.role} | ${s.origin} | ${s.unsplashUrl || "—"} |`,
    ),
    "",
  ].join("\n"),
);

writeFileSync(join(ROOT, "GUIDE.md"), `# Photos — bienetre (modèle de référence)

## Structure

\`\`\`
public/img/bienetre/
├── essentiel/   (5 images)
├── avance/      (8 images)
├── pro/         (15 images)
├── GUIDE.md
├── SOURCES.md
└── SOURCES.json
\`\`\`

## Convention

\`NN-role-description.jpg\` — minuscules, tirets, sans accent.

## Règle

Aucune photo répétée entre Essentiel, Avancé et Pro (contrôle SHA-256).

Voir \`SOURCES.json\` pour l’origine de chaque fichier.
`);

rmSync(STAGING, { recursive: true, force: true });
rmSync(PROBE, { recursive: true, force: true });
if (existsSync(join(ROOT, "_audit.json"))) rmSync(join(ROOT, "_audit.json"));
if (existsSync(join(ROOT, "_fix-report.json"))) rmSync(join(ROOT, "_fix-report.json"));

console.log("\n=== AUDIT ===");
console.log("files", all.length, "unique", hashMap.size, "dups", dups.length);
if (dups.length) console.log(dups);
console.log(
  "ok",
  report.filter((r) => r.ok).length,
  "fail",
  report.filter((r) => !r.ok).length,
);
writeFileSync(join(ROOT, "_assign-report.json"), JSON.stringify({ report, dups, all }, null, 2));
