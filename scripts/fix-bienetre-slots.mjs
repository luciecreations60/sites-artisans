/**
 * Remplace les slots Bien-être hors-sujet / faibles / doublons Unsplash.
 * Conserve les bons fichiers locaux déjà placés.
 *
 * node scripts/fix-bienetre-slots.mjs
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "public", "img", "bienetre");

function sha(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

async function download(id) {
  const urls = [
    `https://images.unsplash.com/photo-${id}?w=1600&q=85&auto=format&fit=crop&fm=jpg`,
    `https://images.unsplash.com/photo-${id}?w=1600&q=80&fm=jpg`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "sites-artisans-demo/3.0", Accept: "image/*" },
        redirect: "follow",
      });
      const ct = res.headers.get("content-type") || "";
      if (!res.ok || !ct.includes("image")) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 50_000) continue;
      return { buf, url: url.split("?")[0], id, bytes: buf.length };
    } catch {
      /* next */
    }
  }
  return null;
}

async function downloadSlug(slug, photoId) {
  // Try slug download page then photo id
  const urls = [
    `https://unsplash.com/photos/${slug}/download?force=true&w=1600`,
    ...(photoId
      ? [
          `https://images.unsplash.com/photo-${photoId}?w=1600&q=85&auto=format&fit=crop&fm=jpg`,
        ]
      : []),
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "sites-artisans-demo/3.0", Accept: "image/*" },
        redirect: "follow",
      });
      const ct = res.headers.get("content-type") || "";
      if (!res.ok || !ct.includes("image")) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 50_000) continue;
      return { buf, url: url.split("?")[0], id: photoId || slug, bytes: buf.length };
    } catch {
      /* next */
    }
  }
  return null;
}

/** Load current hashes + unsplash ids */
const usedHashes = new Set();
const usedIds = new Set();
const sourcesPath = join(ROOT, "SOURCES.json");
let sources = existsSync(sourcesPath)
  ? JSON.parse(readFileSync(sourcesPath, "utf8"))
  : { images: [] };

for (const offer of ["essentiel", "avance", "pro"]) {
  const d = join(ROOT, offer);
  for (const f of readdirSync(d).filter((x) => x.endsWith(".jpg"))) {
    usedHashes.add(sha(readFileSync(join(d, f))));
  }
}
for (const img of sources.images || []) {
  if (img.unsplashId) usedIds.add(String(img.unsplashId).replace(/^photo-/, ""));
}
// IDs Unsplash des fichiers locaux conservés (éviter autre taille / crop)
for (const id of [
  "1600334129128-685c5582fd35", // pierres chaudes HQ → essentiel/03
  "1570172619644-dfd03ed5d881", // soin visage → avance/04 (souvent)
]) {
  usedIds.add(id);
}

/**
 * Remplacements ciblés — photo IDs / slugs choisis pour coller au rôle.
 * Plusieurs candidats par slot (premier qui passe hash+id unique).
 */
const REPLACEMENTS = [
  // Hero essentiel : ambiance institut large (pas bougie flat-lay)
  {
    path: "essentiel/01-hero.jpg",
    reason: "hero trop étroit / bougie flat-lay",
    candidates: [
      { id: "1540555700478-4be289fbecef" }, // spa towels candles wide
      { slug: "mSTU--8zhT0", id: "1706795034887-be9a24d1ac19" },
      { id: "1519823551276-062b8c9f9e3d" },
    ],
  },
  // Soin visage essentiel — PAS pierres chaudes (doublon conceptuel de 03)
  {
    path: "essentiel/04-realisation-soin-visage.jpg",
    reason: "doublon Unsplash pierres chaudes + hors sujet facial",
    candidates: [
      { slug: "tHogec0-_KE", id: "1761718209694-70031ee64f82" },
      { slug: "4pDlorrrOOM", id: "1761718210-placeholder" },
      { id: "1570172619644-dfd03ed5d881" },
      { id: "1515377905703-c4788e51af15" },
      { id: "1616394584738-fc6e612e71b9" },
    ],
  },
  // Hero avancé
  {
    path: "avance/01-hero.jpg",
    reason: "macro goutte d'huile trop faible pour hero",
    candidates: [
      { slug: "JGIfuL-nzCE", id: "1709715490-placeholder" },
      { id: "1544161515-4ab6ce6db874" }, // may collide with avance/03
      { id: "1556228720-195a672e8a03" },
      { id: "1560750588-73207b1ef5b6" },
      { id: "1515377905703-c4788e51af15" },
    ],
  },
  // Pierres chaudes avancé — besoin pierres visibles
  {
    path: "avance/03-realisation-pierres-chaudes.jpg",
    reason: "huile massage sans pierres",
    candidates: [
      { id: "1552693673-1bf958298935" },
      { id: "1600334129128-685c5582fd35" }, // may collide id with kept HQ
      { id: "1596755094514-f87e34085b2c" },
    ],
  },
  // Forfait mariée avancé
  {
    path: "avance/05-realisation-forfait-mariee.jpg",
    reason: "pierres spa ≠ forfait mariée",
    candidates: [
      { id: "1487412720507-e7ab37603c6f" },
      { id: "1522335789203-aabd1fc54bc9" },
      { id: "1580618672591-eb180b1a862f" },
      { id: "1512496015851-a90fb38ba796" },
    ],
  },
  // Pro about
  {
    path: "pro/02-about.jpg",
    reason: "portrait beauté générique → cabine / massage",
    candidates: [
      { slug: "kygrWmp-GdE" },
      { id: "1544161515-4ab6ce6db874" },
      { id: "1515378791036-0648a3ef77b2" },
      { id: "1560750588-73207b1ef5b6" },
    ],
  },
  // Avant pierres — pas yoga
  {
    path: "pro/03-before-pierres-chaudes.jpg",
    reason: "yoga extérieur hors sujet",
    candidates: [
      { id: "1552693673-1bf958298935" },
      { id: "1512290923902-b8637d05d7b0" },
      { id: "1540555700478-4be289fbecef" },
    ],
  },
  // Après — pas manucure
  {
    path: "pro/04-after-pierres-chaudes.jpg",
    reason: "manucure ≠ après pierres chaudes",
    candidates: [
      { id: "1544161515-4ab6ce6db874" },
      { id: "1515377905703-c4788e51af15" },
      { id: "1600334129128-685c5582fd35" },
      { id: "1560750588-73207b1ef5b6" },
    ],
  },
  // Réalisation pierres pro — pas chemise
  {
    path: "pro/05-realisation-pierres-chaudes.jpg",
    reason: "chemise produit hors sujet",
    candidates: [
      { id: "1600334129128-685c5582fd35" },
      { id: "1552693673-1bf958298935" },
      { id: "1544161515-4ab6ce6db874" },
      { slug: "mSTU--8zhT0", id: "1706795034887-be9a24d1ac19" },
    ],
  },
  // Forfait mariée pro — pas laptop
  {
    path: "pro/07-realisation-forfait-mariee.jpg",
    reason: "ordinateur hors sujet",
    candidates: [
      { id: "1512496015851-a90fb38ba796" },
      { id: "1580618672591-eb180b1a862f" },
      { id: "1522337360788-8b1717e44e09" },
      { id: "1487412947147-5cebf100ffc2" },
    ],
  },
  // Réflexologie — pas makeup
  {
    path: "pro/08-realisation-reflexologie.jpg",
    reason: "maquillage ≠ réflexologie",
    candidates: [
      { id: "1515377905703-c4788e51af15" },
      { id: "1544161515-4ab6ce6db874" },
      { id: "1560750588-73207b1ef5b6" },
      { id: "1516975080664-ed2fc6a32937" },
    ],
  },
  // Gommage — pas baignoire
  {
    path: "pro/09-realisation-gommage.jpg",
    reason: "salle de bain ≠ gommage corps",
    candidates: [
      { id: "1512290923902-b8637d05d7b0" },
      { id: "1556228720-195a672e8a03" },
      { id: "1540555700478-4be289fbecef" },
      { id: "1560750588-73207b1ef5b6" },
    ],
  },
  // Atelier entreprise — pas sèche-cheveux
  {
    path: "pro/10-realisation-atelier-entreprise.jpg",
    reason: "sèche-cheveux hors sujet",
    candidates: [
      { id: "1544367567-0f2fcb009e0b" }, // yoga group - weak but wellness group
      { id: "1515378791036-0648a3ef77b2" },
      { id: "1497366216548-37526070297c" },
      { id: "1524758631624-e2822e304c36" },
    ],
  },
  // Service soin visage
  {
    path: "pro/12-service-soin-visage.jpg",
    reason: "pertinence facial",
    candidates: [
      { slug: "tHogec0-_KE", id: "1761718209694-70031ee64f82" },
      { id: "1570172619644-dfd03ed5d881" },
      { id: "1616394584738-fc6e612e71b9" },
    ],
  },
  // Épilation — masque facial actuellement OK-ish but better legs/wax
  {
    path: "pro/13-service-epilation.jpg",
    reason: "masque facial ≠ épilation",
    candidates: [
      { id: "1515377905703-c4788e51af15" },
      { id: "1522338140262-f46f5913618a" },
      { id: "1556228578-0d85b1a4d571" },
      { id: "1570172619644-dfd03ed5d881" },
    ],
  },
  // Manucure — pas produits Curology
  {
    path: "pro/14-service-manucure.jpg",
    reason: "produits skincare ≠ manucure",
    candidates: [
      { id: "1604654894610-df63bc536371" },
      { slug: "cuQZGL7w6h0", id: "1633360971020-656d89f9e98e" },
      { id: "1632345031435-092e439ac543" },
      { id: "1522335789203-aabd1fc54bc9" },
    ],
  },
  // Rituel duo
  {
    path: "pro/15-service-rituel-duo.jpg",
    reason: "produit beauté ≠ duo massage",
    candidates: [
      { id: "1544161515-4ab6ce6db874" }, // two tables in background
      { id: "1540555700478-4be289fbecef" },
      { id: "1600334129128-685c5582fd35" },
      { id: "1515377905703-c4788e51af15" },
    ],
  },
];

async function pickCandidate(cands) {
  for (const c of cands) {
    const idKey = (c.id || c.slug || "").replace(/^photo-/, "");
    if (c.id && usedIds.has(c.id.replace(/^photo-/, ""))) {
      console.log("  skip id used", c.id);
      continue;
    }
    let got = null;
    if (c.slug) got = await downloadSlug(c.slug, c.id);
    if (!got && c.id && !c.id.includes("placeholder")) got = await download(c.id);
    if (!got) {
      console.log("  fail cand", c.id || c.slug);
      continue;
    }
    const h = sha(got.buf);
    if (usedHashes.has(h)) {
      console.log("  skip hash", got.id);
      continue;
    }
    const nid = String(got.id).replace(/^photo-/, "");
    if (usedIds.has(nid) && nid.length > 8) {
      console.log("  skip id after dl", nid);
      continue;
    }
    return got;
  }
  return null;
}

const results = [];

for (const slot of REPLACEMENTS) {
  console.log("\n→", slot.path, "(", slot.reason, ")");
  // free current hash so we can replace
  const full = join(ROOT, slot.path);
  if (existsSync(full)) {
    const old = readFileSync(full);
    usedHashes.delete(sha(old));
  }
  // free old unsplash id for this path
  sources.images = (sources.images || []).filter((x) => x.file !== `bienetre/${slot.path}`);

  const got = await pickCandidate(slot.candidates);
  if (!got) {
    console.error("FAIL", slot.path);
    results.push({ path: slot.path, ok: false, reason: slot.reason });
    // restore hash of existing if still there
    if (existsSync(full)) usedHashes.add(sha(readFileSync(full)));
    continue;
  }
  writeFileSync(full, got.buf);
  usedHashes.add(sha(got.buf));
  const nid = String(got.id).replace(/^photo-/, "");
  usedIds.add(nid);
  sources.images.push({
    file: `bienetre/${slot.path}`,
    offer: slot.path.split("/")[0],
    role: slot.path.split("/")[1].replace(/^\d+-/, "").replace(/\.jpg$/, ""),
    origin: "Unsplash",
    unsplashId: nid,
    unsplashUrl: nid.includes("-") && /^\d/.test(nid)
      ? `https://unsplash.com/photos/${nid}`
      : `https://unsplash.com/photos/${nid}`,
    downloadUrl: got.url,
    bytes: got.bytes,
    replacedBecause: slot.reason,
  });
  console.log("OK", got.id, got.bytes);
  results.push({ path: slot.path, ok: true, id: got.id, bytes: got.bytes, reason: slot.reason });
}

sources.updatedAt = new Date().toISOString();
writeFileSync(sourcesPath, JSON.stringify(sources, null, 2));

// rebuild SOURCES.md
const md = [
  "# Sources images — bienetre",
  "",
  "| Fichier | Offre | Rôle | Origine | URL Unsplash |",
  "|---|---|---|---|---|",
  ...(sources.images || []).map((s) => {
    return `| \`${s.file}\` | ${s.offer} | ${s.role} | ${s.origin} | ${s.unsplashUrl || s.previousFile || "—"} |`;
  }),
  "",
].join("\n");
writeFileSync(join(ROOT, "SOURCES.md"), md);

// final audit
const files = [];
for (const offer of ["essentiel", "avance", "pro"]) {
  for (const f of readdirSync(join(ROOT, offer)).filter((x) => x.endsWith(".jpg"))) {
    files.push(join(ROOT, offer, f));
  }
}
const map = new Map();
for (const f of files) {
  const h = sha(readFileSync(f));
  if (!map.has(h)) map.set(h, []);
  map.get(h).push(f);
}
const dups = [...map.values()].filter((l) => l.length > 1);
console.log("\n=== AUDIT ===");
console.log("files", files.length, "unique", map.size, "dups", dups.length);
console.log("replaced ok", results.filter((r) => r.ok).length, "/", results.length);
writeFileSync(join(ROOT, "_fix-report.json"), JSON.stringify({ results, dups }, null, 2));
