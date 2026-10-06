/**
 * Réorganise les 10 métiers (hors bienetre déjà fait) sur le modèle :
 *   public/img/{slug}/{essentiel|avance|pro}/NN-role.jpg
 * Règle : 0 doublon SHA256 / Unsplash ID à l'intérieur d'un métier.
 *
 * Usage : node scripts/organize-all-trades-media.mjs
 */
import { createHash } from "node:crypto";
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

const ROOT = process.cwd();
const IMG = join(ROOT, "public", "img");
const TRADES_DIR = join(ROOT, "app", "data", "trades");

const SKIP = new Set(["bienetre"]); // déjà standardisé

function sha(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

function slugify(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36);
}

function parseTradeFile(slug) {
  const src = readFileSync(join(TRADES_DIR, `${slug}.ts`), "utf8");
  const titlesMatch = src.match(/projectTitles:\s*\[([\s\S]*?)\],/);
  const projects = titlesMatch
    ? [...titlesMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
    : [];
  // services: first 5 title: "..." inside services array
  const svcBlock = src.match(/services:\s*\[([\s\S]*?)\],\s*projectTitles/);
  const services = svcBlock
    ? [...svcBlock[1].matchAll(/title:\s*"([^"]+)"/g)].map((m) => m[1]).slice(0, 5)
    : [];
  return { projects, services };
}

function pad(n) {
  return String(n).padStart(2, "0");
}

/** Construit la liste ordonnée des slots (chemins relatifs au dossier métier). */
function buildSlots(projects, services) {
  const p = projects.map((t) => slugify(t));
  const s = services.map((t) => slugify(t));
  while (p.length < 6) p.push(`projet-${p.length + 1}`);
  while (s.length < 5) s.push(`service-${s.length + 1}`);

  /** @type {{ path: string, role: string, offer: string }[]} */
  const slots = [];
  // ESSENTIEL 5
  slots.push({ path: `essentiel/${pad(1)}-hero.jpg`, role: "hero", offer: "essentiel" });
  slots.push({ path: `essentiel/${pad(2)}-about.jpg`, role: "about", offer: "essentiel" });
  for (let i = 0; i < 3; i++) {
    slots.push({
      path: `essentiel/${pad(3 + i)}-realisation-${p[i]}.jpg`,
      role: `realisation-${p[i]}`,
      offer: "essentiel",
    });
  }
  // AVANCE 8
  slots.push({ path: `avance/${pad(1)}-hero.jpg`, role: "hero", offer: "avance" });
  slots.push({ path: `avance/${pad(2)}-about.jpg`, role: "about", offer: "avance" });
  for (let i = 0; i < 6; i++) {
    slots.push({
      path: `avance/${pad(3 + i)}-realisation-${p[i]}.jpg`,
      role: `realisation-${p[i]}`,
      offer: "avance",
    });
  }
  // PRO 15
  slots.push({ path: `pro/${pad(1)}-hero.jpg`, role: "hero", offer: "pro" });
  slots.push({ path: `pro/${pad(2)}-about.jpg`, role: "about", offer: "pro" });
  slots.push({
    path: `pro/${pad(3)}-before-${p[0]}.jpg`,
    role: `before-${p[0]}`,
    offer: "pro",
  });
  slots.push({
    path: `pro/${pad(4)}-after-${p[0]}.jpg`,
    role: `after-${p[0]}`,
    offer: "pro",
  });
  for (let i = 0; i < 6; i++) {
    slots.push({
      path: `pro/${pad(5 + i)}-realisation-${p[i]}.jpg`,
      role: `realisation-${p[i]}`,
      offer: "pro",
    });
  }
  for (let i = 0; i < 5; i++) {
    slots.push({
      path: `pro/${pad(11 + i)}-service-${s[i]}.jpg`,
      role: `service-${s[i]}`,
      offer: "pro",
    });
  }
  return slots;
}

/** Pools Unsplash élargis par métier (IDs free images.unsplash.com/photo-{id}). */
const POOLS = {
  plombier: [
    "1584622650111-993a426fbf0a",
    "1507652313519-d4e9174996dd",
    "1552321554-5fefe8c9ef14",
    "1620626011761-996317b8d101",
    "1600607687939-ce8a6c25118c",
    "1556909114-f6e7ad7d3136",
    "1600566753194-b90bf9a0c0e0",
    "1584622781564-1d987f7332c1",
    "1600566753086-00f923ceb513",
    "1552321554-5fefe8c9ef14",
    "1493809842364-78817add7ffb",
    "1600585154340-be6161a56a0c",
    "1560440021-8fac3c4e25f1",
    "1507084927917-a8e0b3e0e0e0",
    "1556911220-bff31c99235d",
    "1556912172-46c33647ff44",
    "1565183997398-1e0f0e0e0e0e",
    "1574629810360-7efbbe195018",
    "1584622650111-993a426fbf0a",
    "1595515106962-5e0a00000000",
  ],
  electricien: [
    "1621905251189-08b45d6a269e",
    "1497366216548-37526070297c",
    "1556909114-f6e7ad7d3136",
    "1617788138017-80ad40651399",
    "1600585154340-be6161a56a0c",
    "1493809842364-78817add7ffb",
    "1618221195710-dd6b41faaea6",
    "1558611848-73f7b401654f",
    "1593941707882-a456bb7ac180",
    "1503387762-592deb58ef4e",
    "1517245386807-bb43f82c933d",
    "1497366754035-f200968a6e72",
    "1497366811353-6870744d04b2",
    "1524758631624-e2822e304c36",
    "1497215728101-856f4ea42174",
    "1558002038-1055907dfad0",
    "1560518883-ce09059ee382",
    "1519389950473-47ba0277781c",
  ],
  couvreur: [
    "1504307651254-35680f356dfd",
    "1541888946425-d81bb19240f5",
    "1570129477492-45c003edd2be",
    "1449844908441-8829872d2607",
    "1564013799919-ab600027ffc6",
    "1605276374104-dee2a0ed3cd6",
    "1503387762-592deb58ef4e",
    "1512917774080-9991f1c4c750",
    "1560518883-ce09059ee382",
    "1605276374104-dee2a0ed3cd6",
    "1486406149866-c6f2f0b0b0b0",
    "1460317442991-0ec209397118",
    "1448630360428-65456885c650",
    "1472224371017-08207f84aa35",
    "1564013497870-5f1f0e0e0e0e",
    "1600047509807-ba21b0e0e0e0",
  ],
  peintre: [
    "1562259949-e8e7689d7828",
    "1513364776144-60967b0f800f",
    "1618221195710-dd6b41faaea6",
    "1564013799919-ab600027ffc6",
    "1616486338812-3dadae4b4ace",
    "1497366216548-37526070297c",
    "1524758631624-e2822e304c36",
    "1589939705384-5184d4a2c0e6",
    "1615874959474-d163d25d8f7c",
    "1562259949-e8e7689d7828",
    "1503387762-592deb58ef4e",
    "1493809842364-78817add7ffb",
    "1600210492489-404d5b0f0e0e",
    "1600585154526-990dced4db0d",
    "1600607687644-c7171b42498b",
    "1600566752355-35715348e0e0",
    "1513694203232-719a280e022f",
  ],
  paysagiste: [
    "1416879595882-3373a0480b5b",
    "1558904541-efa843a96f01",
    "1490750967868-88aa4486c946",
    "1600585154340-be6161a56a0c",
    "1564013799919-ab600027ffc6",
    "1523348837708-15d4a09cfac2",
    "1500382017468-9049fed747ef",
    "1466692476866-a8051ffd6c4c",
    "1591857177580-dc82b9cffb3a",
    "1416879595882-3373a0480b5b",
    "1558618666-fcd25c85cd64",
    "1470059869976-4e0a0e0e0e0e",
    "1464226184884-fa280b87c399",
    "1416879595882-3373a0480b5b",
    "1585320806297-0e0a00000000",
    "1501004318641-b39e6451bec6",
    "1469474960831-0e0a00000000",
  ],
  garage: [
    "1492144534655-ae79c964c9d7",
    "1503376780353-7e6692767b70",
    "1486262715619-67efe4c5f0c0",
    "1492144534655-ae79c964c9d7",
    "1553440569-bcc63803db0e",
    "1619649907800-9d4c9c6f5e6f",
    "1502877338531-0e0a00000000",
    "1494976388531-d1058494cdd8",
    "1487751819627-0e0a00000000",
    "1549317666-0e0a00000000",
    "1550355291-bbee04a440c0e",
    "1617814076363-0e0a00000000",
    "1605559424843-0e0a00000000",
    "1511910849305-0e0a00000000",
    "1563720223185-0e0a00000000",
    "1600661639611-0e0a00000000",
  ],
  boulanger: [
    "1509440159596-0249088772ff",
    "1555507036-ab1f4038808a",
    "1578985545062-69928b1d9587",
    "1464349095431-e9a21285b5f3",
    "1509440159596-0249088772ff",
    "1517433670267-08bb50329277",
    "1549931319-a545dcf3bc73",
    "1509440159596-0249088772ff",
    "1568254183911-0e0a00000000",
    "1608198093002-0e0a00000000",
    "1558961363-fa8fdf82db35",
    "1517433027660-0e0a00000000",
    "1576617387790-0e0a00000000",
    "1486427946971-0e0a00000000",
    "1546549032-0e0a00000000",
    "1495147466023-0e0a00000000",
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
    "1580618672591-eb180b1a862f",
    "1516975080664-ed2fc6a32937",
    "1487412720507-e7ab37603c6f",
    "1487412947147-5cebf100ffc2",
    "1512496015851-a90fb38ba796",
    "1595475872655-0e0a00000000",
    "1562322140-8baeececf3df",
    "1521590832167-0e0a00000000",
  ],
  cordonnier: [
    "1608256246200-53e635b5b65f",
    "1549298916-b41d501d3772",
    "1543163521-1bf539c55dd2",
    "1460353581641-37baddab0fa2",
    "1542291026-7eec264c27ff",
    "1520639888713-7857fa8184c8",
    "1511556824070-b28954b1f8b8",
    "1491553895911-0104e9a08aa8",
    "1606107557195-0e29a4b5b4aa",
    "1551107696-a4b0c40d4d6f",
    "1549298916-b41d501d3772",
    "1460353581641-37baddab0fa2",
    "1600185365922-0e29a4b5b4aa",
    "1515955654030-0e29a4b5b4aa",
    "1542272604-787c3835535d",
  ],
  serrurier: [
    "1558618666-fcd25c85cd64",
    "1564013799919-ab600027ffc6",
    "1560518883-ce09059ee382",
    "1558002038-1055907dfad0",
    "1516455590532-db1e6ebc5b9a",
    "1582139329536-e72821d2e2c3",
    "1522771739844-6a9f6d5f14af",
    "1560518883-ce09059ee382",
    "1493809842364-78817add7ffb",
    "1600585154340-be6161a56a0c",
    "1512917774080-9991f1c4c750",
    "1560440021-8fac3c4e25f1",
    "1503387762-592deb58ef4e",
    "1486406149866-c6f2f0b0b0b0",
    "1472224371017-08207f84aa35",
  ],
};

/** Pool générique de secours (habitat / atelier / outils) — IDs souvent dispo. */
const GLOBAL_FALLBACK = [
  "1497366216548-37526070297c",
  "1493809842364-78817add7ffb",
  "1600585154340-be6161a56a0c",
  "1524758631624-e2822e304c36",
  "1564013799919-ab600027ffc6",
  "1618221195710-dd6b41faaea6",
  "1503387762-592deb58ef4e",
  "1512917774080-9991f1c4c750",
  "1497215728101-856f4ea42174",
  "1497366754035-f200968a6e72",
  "1556911220-bff31c99235d",
  "1556909114-f6e7ad7d3136",
  "1600607687939-ce8a6c25118c",
  "1584622650111-993a426fbf0a",
  "1507652313519-d4e9174996dd",
  "1552321554-5fefe8c9ef14",
  "1620626011761-996317b8d101",
  "1541888946425-d81bb19240f5",
  "1570129477492-45c003edd2be",
  "1449844908441-8829872d2607",
  "1504307651254-35680f356dfd",
  "1605276374104-dee2a0ed3cd6",
  "1562259949-e8e7689d7828",
  "1513364776144-60967b0f800f",
  "1616486338812-3dadae4b4ace",
  "1416879595882-3373a0480b5b",
  "1558904541-efa843a96f01",
  "1490750967868-88aa4486c946",
  "1523348837708-15d4a09cfac2",
  "1500382017468-9049fed747ef",
  "1492144534655-ae79c964c9d7",
  "1503376780353-7e6692767b70",
  "1486262715619-67efe4c5f0c0",
  "1553440569-bcc63803db0e",
  "1494976388531-d1058494cdd8",
  "1509440159596-0249088772ff",
  "1555507036-ab1f4038808a",
  "1578985545062-69928b1d9587",
  "1464349095431-e9a21285b5f3",
  "1549931319-a545dcf3bc73",
  "1558961363-fa8fdf82db35",
  "1560066984-138dadb4c035",
  "1522337360788-8b13dee7a37e",
  "1562322140-8baeececf3df",
  "1599351431202-1e0f0137899a",
  "1522335789203-aabd1fc54bc9",
  "1608256246200-53e635b5b65f",
  "1549298916-b41d501d3772",
  "1543163521-1bf539c55dd2",
  "1460353581641-37baddab0fa2",
  "1542291026-7eec264c27ff",
  "1558618666-fcd25c85cd64",
  "1560518883-ce09059ee382",
  "1558002038-1055907dfad0",
  "1621905251189-08b45d6a269e",
  "1617788138017-80ad40651399",
  "1593941707882-a456bb7ac180",
];

const downloadCache = new Map();

async function fetchPhoto(id) {
  const clean = String(id).replace(/^photo-/, "").replace(/^flagged\//, "");
  if (downloadCache.has(clean)) return downloadCache.get(clean);
  const urls = [
    `https://images.unsplash.com/photo-${clean}?w=1600&q=85&auto=format&fit=crop&fm=jpg`,
    `https://images.unsplash.com/photo-${clean}?w=1600&q=80&fm=jpg`,
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
      if (buf.length < 40_000) continue;
      const got = { buf, id: clean, url: url.split("?")[0], bytes: buf.length };
      downloadCache.set(clean, got);
      return got;
    } catch {
      /* next */
    }
  }
  downloadCache.set(clean, null);
  return null;
}

function listFlatJpgs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => {
    const full = join(dir, f);
    return f.endsWith(".jpg") && statSync(full).isFile();
  });
}

function writeMediaTs(slug, slots) {
  const byOffer = { essentiel: [], avance: [], pro: [] };
  for (const s of slots) byOffer[s.offer].push(s);

  const ess = byOffer.essentiel;
  const av = byOffer.avance;
  const pr = byOffer.pro;

  const body = `import type { TradeMediaManifest } from "./mediaTypes";

/** Manifest média — ${slug} (chemins relatifs à public/img/${slug}/) */
export const ${slug}Media = {
  essentiel: {
    hero: ${JSON.stringify(ess[0].path)},
    about: ${JSON.stringify(ess[1].path)},
    realisations: ${JSON.stringify(ess.slice(2).map((x) => x.path))},
  },
  avance: {
    hero: ${JSON.stringify(av[0].path)},
    about: ${JSON.stringify(av[1].path)},
    realisations: ${JSON.stringify(av.slice(2).map((x) => x.path))},
  },
  pro: {
    hero: ${JSON.stringify(pr[0].path)},
    about: ${JSON.stringify(pr[1].path)},
    before: ${JSON.stringify(pr[2].path)},
    after: ${JSON.stringify(pr[3].path)},
    realisations: ${JSON.stringify(pr.slice(4, 10).map((x) => x.path))},
    services: ${JSON.stringify(pr.slice(10).map((x) => x.path))},
  },
} as const satisfies TradeMediaManifest;
`;
  writeFileSync(join(TRADES_DIR, `${slug}.media.ts`), body);
}

async function organizeTrade(slug) {
  console.log(`\n######## ${slug} ########`);
  const { projects, services } = parseTradeFile(slug);
  const slots = buildSlots(projects, services);
  const dir = join(IMG, slug);
  mkdirSync(dir, { recursive: true });

  const usedHashes = new Set();
  const usedIds = new Set();
  const sources = [];
  const staging = join(dir, "_staging");
  mkdirSync(staging, { recursive: true });

  // Collect unique local flat JPGs
  const flat = listFlatJpgs(dir);
  const uniqueLocals = [];
  const seen = new Set();
  for (const f of flat) {
    const buf = readFileSync(join(dir, f));
    const h = sha(buf);
    if (seen.has(h)) continue;
    seen.add(h);
    uniqueLocals.push({ file: f, buf, hash: h });
  }
  console.log(`  local unique ${uniqueLocals.length} / flat ${flat.length} / slots ${slots.length}`);

  // Prefer assigning locals to avance first (hub default), then essentiel, then pro
  const assignOrder = [
    ...slots.filter((s) => s.offer === "avance"),
    ...slots.filter((s) => s.offer === "essentiel"),
    ...slots.filter((s) => s.offer === "pro"),
  ];

  const filled = new Set();
  let li = 0;
  for (const slot of assignOrder) {
    if (li >= uniqueLocals.length) break;
    const loc = uniqueLocals[li++];
    usedHashes.add(loc.hash);
    const out = join(staging, slot.path);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, loc.buf);
    filled.add(slot.path);
    sources.push({
      file: `${slug}/${slot.path}`,
      offer: slot.offer,
      role: slot.role,
      origin: "local-kept",
      previousFile: loc.file,
      bytes: loc.buf.length,
    });
    console.log(`  KEEP ${slot.path} ← ${loc.file}`);
  }

  // Download for remaining
  const pool = [...(POOLS[slug] || []), ...GLOBAL_FALLBACK];
  let poolIdx = 0;
  for (const slot of slots) {
    if (filled.has(slot.path)) continue;
    let got = null;
    while (poolIdx < pool.length) {
      const id = pool[poolIdx++];
      if (usedIds.has(id)) continue;
      const photo = await fetchPhoto(id);
      if (!photo) continue;
      const h = sha(photo.buf);
      if (usedHashes.has(h)) continue;
      usedHashes.add(h);
      usedIds.add(photo.id);
      got = photo;
      break;
    }
    if (!got) {
      console.error(`  FAIL ${slot.path}`);
      continue;
    }
    const out = join(staging, slot.path);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, got.buf);
    filled.add(slot.path);
    sources.push({
      file: `${slug}/${slot.path}`,
      offer: slot.offer,
      role: slot.role,
      origin: "Unsplash",
      unsplashId: got.id,
      unsplashUrl: `https://unsplash.com/photos/${got.id}`,
      bytes: got.bytes,
    });
    console.log(`  DL   ${slot.path} ← ${got.id} (${got.bytes})`);
  }

  // Promote staging → final
  for (const offer of ["essentiel", "avance", "pro"]) {
    mkdirSync(join(dir, offer), { recursive: true });
  }
  for (const slot of slots) {
    const staged = join(staging, slot.path);
    if (!existsSync(staged)) continue;
    // rematerialize (avoid OneDrive reparse)
    const buf = readFileSync(staged);
    writeFileSync(join(dir, slot.path), buf);
  }

  // Remove legacy flat jpgs + guide leftovers at root of trade
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (["_staging"].includes(name)) {
        rmSync(full, { recursive: true, force: true });
      }
      continue;
    }
    if (/\.(jpe?g|png|webp)$/i.test(name)) {
      rmSync(full, { force: true });
      console.log(`  rm legacy ${name}`);
    }
  }

  writeFileSync(
    join(dir, "SOURCES.json"),
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        duplicateCheck: {
          files: filled.size,
          uniqueHashes: usedHashes.size,
        },
        images: sources,
      },
      null,
      2,
    ),
  );

  writeFileSync(
    join(dir, "GUIDE.md"),
    `# Photos — ${slug}

Structure modèle (comme Bien-être) :

\`\`\`
public/img/${slug}/
├── essentiel/
├── avance/
├── pro/
├── GUIDE.md
└── SOURCES.json
\`\`\`

Convention : \`NN-role-description.jpg\` — une photo unique par rôle, jamais répétée entre offres.
`,
  );

  writeMediaTs(slug, slots.filter((s) => filled.has(s.path)));

  const missing = slots.filter((s) => !filled.has(s.path)).map((s) => s.path);
  console.log(`  done filled=${filled.size}/${slots.length} missing=${missing.length}`);
  return { slug, filled: filled.size, total: slots.length, missing };
}

function writeRegistry(slugs) {
  const imports = [
    `import type { TradeSlug } from "../types";`,
    `import type { TradeMediaManifest } from "./mediaTypes";`,
    `import { bienetreMedia } from "./bienetre.media";`,
    ...slugs.map((s) => `import { ${s}Media } from "./${s}.media";`),
  ].join("\n");

  const entries = [
    `  bienetre: bienetreMedia,`,
    ...slugs.map((s) => `  ${s}: ${s}Media,`),
  ].join("\n");

  const body = `${imports}

export const tradeMedia = {
${entries}
} as const satisfies Partial<Record<TradeSlug, TradeMediaManifest>>;

export function getTradeMedia(slug: string): TradeMediaManifest | undefined {
  return tradeMedia[slug as TradeSlug];
}
`;
  writeFileSync(join(TRADES_DIR, "media.ts"), body);
}

const slugs = readdirSync(TRADES_DIR)
  .filter((f) => f.endsWith(".ts") && !f.includes("media") && f !== "_build.ts" && f !== "types.ts")
  .map((f) => f.replace(/\.ts$/, ""))
  .filter((s) => !SKIP.has(s));

const results = [];
for (const slug of slugs) {
  results.push(await organizeTrade(slug));
}
writeRegistry(slugs);

console.log("\n===== SUMMARY =====");
for (const r of results) {
  console.log(
    `${r.slug}: ${r.filled}/${r.total}` +
      (r.missing.length ? ` MISSING ${r.missing.join(",")}` : " OK"),
  );
}
writeFileSync(join(ROOT, "scripts/_organize-all-report.json"), JSON.stringify(results, null, 2));
