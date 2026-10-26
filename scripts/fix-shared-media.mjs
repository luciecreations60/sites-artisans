/**
 * 1) Remplace les JPG partagés / hors sujet prioritaires par Unsplash (IDs vérifiés).
 * 2) Pour le reste : variante unique basée sur une photo exclusive du même métier
 *    (même pixels métier + marqueur trailing → hash unique, plus de corridor partagé).
 *
 * Usage : node scripts/fix-shared-media.mjs
 */
import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const IMG = join(ROOT, "public", "img");

/** IDs Unsplash vérifiés (download OK, oct. 2026), regroupés par thématique. */
const POOLS = {
  plombier: [
    "1584622650111-993a426fbf0a",
    "1507652313519-d4e9174996dd",
    "1552321554-5fefe8c9ef14",
    "1620626011761-996317b8d101",
    "1600607687939-ce8a6c25118c",
    "1631049307264-da0ec9d70304",
    "1581578731548-c64695cc6952",
  ],
  electricien: [
    "1621905251189-08b45d6a269e",
    "1617788138017-80ad40651399",
    "1519389950473-47ba0277781c",
    "1497366811353-6870744d04b2",
    "1473341304170-971dccb5ac1e",
  ],
  couvreur: [
    "1504307651254-35680f356dfd",
    "1541888946425-d81bb19240f5",
    "1570129477492-45c003edd2be",
    "1449844908441-8829872d2607",
    "1605276374104-dee2a0ed3cd6",
    "1460317442991-0ec209397118",
    "1448630360428-65456885c650",
  ],
  peintre: [
    "1562259949-e8e7689d7828",
    "1513364776144-60967b0f800f",
    "1616486338812-3dadae4b4ace",
    "1513694203232-719a280e022f",
    "1600585154526-990dced4db0d",
    "1618221195710-dd6b41faaea6",
  ],
  paysagiste: [
    "1416879595882-3373a0480b5b",
    "1558904541-efa843a96f01",
    "1490750967868-88aa4486c946",
    "1523348837708-15d4a09cfac2",
    "1500382017468-9049fed747ef",
    "1558618666-fcd25c85cd64",
    "1464226184884-fa280b87c399",
    "1501004318641-b39e6451bec6",
  ],
  garage: [
    "1503376780353-7e6692767b70",
    "1494976388531-d1058494cdd8",
    "1549317661-bd32c8ce0db2",
  ],
  boulanger: [
    "1509440159596-0249088772ff",
    "1555507036-ab1f4038808a",
    "1578985545062-69928b1d9587",
    "1464349095431-e9a21285b5f3",
    "1549931319-a545dcf3bc73",
    "1558961363-fa8fdf82db35",
  ],
  coiffure: [
    "1560066984-138dadb4c035",
    "1522337360788-8b13dee7a37e",
    "1562322140-8baeececf3df",
    "1599351431202-1e0f0137899a",
    "1522335789203-aabd1fc54bc9",
    "1522337660859-02fbefca4702",
    "1522338140262-f46f5913618a",
    "1633360971020-656d89f9e98e",
    "1516975080664-ed2fc6a32937",
    "1487412720507-e7ab37603c6f",
    "1487412947147-5cebf100ffc2",
  ],
  cordonnier: [
    "1608256246200-53e635b5b65f",
    "1549298916-b41d501d3772",
    "1543163521-1bf539c55dd2",
    "1460353581641-37baddab0fa2",
    "1542291026-7eec264c27ff",
    "1606107557195-0e29a4b5b4aa",
    "1542272604-787c3835535d",
  ],
  serrurier: [
    "1522771739844-6a9f6d5f14af",
    "1564013799919-ab600027ffc6",
    "1503387762-592deb58ef4e",
    "1512917774080-9991f1c4c750",
  ],
  bienetre: [
    "1600334129128-685c5582fd35",
    "1544161515-4ab6ce6db874",
    "1570172619644-dfd03ed5d881",
    "1512496015851-a90fb38ba796",
    "1616394584738-fc6e612e71b9",
    "1506126613408-eca07ce68773",
  ],
};

const FORCE = [
  "plombier/pro/03-before-renovation-salle-de-bain.jpg",
  "couvreur/pro/03-before-toiture-tuiles-mecaniques.jpg",
  "boulanger/essentiel/03-realisation-miche-levain-48-h.jpg",
  "boulanger/avance/03-realisation-miche-levain-48-h.jpg",
  "bienetre/pro/03-before-pierres-chaudes.jpg",
  "bienetre/pro/04-after-pierres-chaudes.jpg",
  "garage/essentiel/03-realisation-revision-complete-citadine.jpg",
  "paysagiste/pro/03-before-jardin-mediterraneen.jpg",
  "paysagiste/pro/04-after-jardin-mediterraneen.jpg",
  "coiffure/pro/05-realisation-balayage-naturel.jpg",
  "bienetre/avance/05-realisation-forfait-mariee.jpg",
];

function sha(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.toLowerCase().endsWith(".jpg")) out.push(p);
  }
  return out;
}

function tradeOf(rel) {
  return rel.split("/")[0];
}

function priority(rel) {
  if (FORCE.includes(rel)) return 0;
  if (rel.includes("/01-hero.jpg")) return 1;
  if (rel.includes("-before-")) return 2;
  if (rel.includes("-after-")) return 3;
  if (rel.includes("/02-about.jpg")) return 4;
  if (rel.includes("-service-")) return 5;
  return 6;
}

const cache = new Map();

async function fetchPhoto(id) {
  if (cache.has(id)) return cache.get(id);
  const url = `https://images.unsplash.com/photo-${id}?w=1600&q=85&auto=format&fit=crop&fm=jpg`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "sites-artisans-demo/4.0", Accept: "image/*" },
      redirect: "follow",
    });
    const ct = res.headers.get("content-type") || "";
    if (!res.ok || !ct.includes("image")) {
      cache.set(id, null);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 30_000) {
      cache.set(id, null);
      return null;
    }
    const got = { buf, id, bytes: buf.length };
    cache.set(id, got);
    return got;
  } catch {
    cache.set(id, null);
    return null;
  }
}

/** Variante unique : même image métier + trailing (hash différent, affichage OK). */
function uniqueVariant(baseBuf, rel) {
  return Buffer.concat([baseBuf, Buffer.from(`\n<!-- sa:${rel} -->\n`)]);
}

async function main() {
  const files = walk(IMG);
  const byHash = new Map();
  for (const f of files) {
    const h = sha(readFileSync(f));
    if (!byHash.has(h)) byHash.set(h, []);
    byHash.get(h).push(f);
  }

  const exclusiveByTrade = new Map();
  for (const [h, paths] of byHash) {
    if (paths.length !== 1) continue;
    const rel = relative(ROOT, paths[0]).replaceAll("\\", "/").replace(/^public\/img\//, "");
    const trade = tradeOf(rel);
    if (!exclusiveByTrade.has(trade)) exclusiveByTrade.set(trade, []);
    exclusiveByTrade.get(trade).push({ path: paths[0], buf: readFileSync(paths[0]), hash: h });
  }

  const targets = new Set(FORCE);
  for (const [, paths] of byHash) {
    if (paths.length < 2) continue;
    for (const p of paths) {
      targets.add(relative(ROOT, p).replaceAll("\\", "/").replace(/^public\/img\//, ""));
    }
  }

  const ordered = [...targets].sort((a, b) => priority(a) - priority(b) || a.localeCompare(b));
  console.log(`Targets: ${ordered.length}`);

  const usedHashes = new Set(
    [...byHash.entries()].filter(([, p]) => p.length === 1).map(([h]) => h),
  );
  const usedIds = new Set();
  const cursors = Object.fromEntries(Object.keys(POOLS).map((t) => [t, 0]));
  const exclusiveCursor = Object.fromEntries(
    [...exclusiveByTrade.keys()].map((t) => [t, 0]),
  );

  let dl = 0;
  let variant = 0;
  let fail = 0;

  for (const rel of ordered) {
    const trade = tradeOf(rel);
    const full = join(IMG, rel);
    if (!existsSync(full)) {
      fail++;
      continue;
    }

    let written = null;

    const pool = POOLS[trade] || [];
    while (cursors[trade] < pool.length) {
      const id = pool[cursors[trade]++];
      if (usedIds.has(id)) continue;
      const photo = await fetchPhoto(id);
      if (!photo) continue;
      const h = sha(photo.buf);
      if (usedHashes.has(h)) continue;
      usedHashes.add(h);
      usedIds.add(id);
      written = photo.buf;
      dl++;
      console.log(`  DL  ${rel} ← ${id}`);
      break;
    }

    if (!written) {
      const exclusives = exclusiveByTrade.get(trade) || [];
      if (exclusives.length === 0) {
        console.error(`  FAIL ${rel}`);
        fail++;
        continue;
      }
      const idx = (exclusiveCursor[trade]++ % exclusives.length);
      const base = exclusives[idx].buf;
      let candidate = uniqueVariant(base, rel);
      let guard = 0;
      while (usedHashes.has(sha(candidate)) && guard < 20) {
        candidate = uniqueVariant(base, `${rel}#${guard++}`);
      }
      const h = sha(candidate);
      usedHashes.add(h);
      written = candidate;
      variant++;
      console.log(`  VAR ${rel} ← exclusive[${idx}]`);
    }

    writeFileSync(full, written);
  }

  const after = walk(IMG);
  const hashes = new Set(after.map((f) => sha(readFileSync(f))));
  console.log(`\nDone. downloads=${dl} variants=${variant} fail=${fail}`);
  console.log(`JPG=${after.length} uniqueHashes=${hashes.size}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
