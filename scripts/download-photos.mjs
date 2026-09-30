import { mkdirSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** Candidate Unsplash IDs grouped by theme — validated at runtime. */
const CANDIDATES = {
  wood: [
    "1601058268499-e52658b8bb88",
    "1541123437800-1bb1317badc2",
    "1556912167-f556f1f39fdf",
    "1524758631624-e2822e304c36",
    "1565182999561-18d7dc61c393",
    "1533090161767-e6ffed986c88",
    "1530124566582-a618bc2615dc",
    "1516972810927-80185027ca84",
    "1452860606245-08befc0ff44b",
  ],
  home: [
    "1584622650111-993a426fbf0a",
    "1507652313519-d4e9174996dd",
    "1552321554-5fefe8c9ef14",
    "1493809842364-78817add7ffb",
    "1600566753190-17f0baa2a6c3",
    "1618221195710-dd6b41faaea6",
    "1616486338812-3dadae4b4ace",
    "1615874959474-d163d25d8f7c",
    "1600585154340-be6161a56a0c",
  ],
  build: [
    "1504307651254-35680f356dfd",
    "1541888946425-d81bb19240f5",
    "1486406146926-c627a92ad1ab",
    "1503387762-592deb58ef4e",
    "1513585711002-0825bce3b8c5",
    "1564013799919-ab600027ffc6",
    "1570129477492-45c003edd2be",
    "1605276374104-dee2a0ed3cd6",
    "1449844908441-8829872d2607",
    "1473341304170-971dccb5ac1e",
  ],
  electric: [
    "1621905251189-08b45d6a269e",
    "1621905252507-b35492ae6964",
    "1558002038-1055907dfad0",
    "1497366216548-37526070297c",
    "1513828586688-f87b4c7b55c0",
    "1473341304170-971dccb5ac1e",
  ],
  paint: [
    "1562259949-e8e7689d7828",
    "1513364776144-60967b0f800f",
    "1589939705384-5184d4a2c0e6",
  ],
  garden: [
    "1416879595882-3373a0480b5b",
    "1585320806299-c0b6cdee6a1b",
    "1466692476866-a8051ffd6c4c",
    "1500382017468-9049fed747ef",
  ],
  car: [
    "1492144534655-ae79c964c9d7",
    "1503376780353-7e6692767b70",
    "1486262715619-67efe4c5f0c0",
  ],
  food: [
    "1509440159596-0249088772ff",
    "1517433670267-08bbd4be890f",
    "1555507036-ab1f4038808a",
    "1578985545062-69928b1d9587",
    "1464349095431-e9a21285b5f3",
  ],
  hair: [
    "1560066984-138dadb4c035",
    "1522337360788-8b13dee7a37e",
    "1562322140-8baeececf3df",
    "1493256338651-d37fabe471c0c",
  ],
  spa: [
    "1540555700478-4be289fbecef",
    "1544168190-a16b35daf4f0",
    "1515377905703-c4788e51af15",
    "1570172619644-dfd03ed5d881",
    "1600334129128-685c5582fd35",
  ],
  craft: [
    "1452860606245-08befc0ff44b",
    "1513364776144-60967b0f800f",
    "1541123437800-1bb1317badc2",
  ],
};

const ASSIGN = {
  menuisier: "wood",
  plombier: "home",
  electricien: "electric",
  couvreur: "build",
  peintre: "paint",
  paysagiste: "garden",
  macon: "build",
  garage: "car",
  boulanger: "food",
  coiffure: "hair",
  bienetre: "spa",
  autre: "craft",
};

const WITH_BA = new Set(["plombier", "peintre", "paysagiste", "macon", "garage"]);
const NAMES_BASE = ["hero", "atelier", "p1", "p2", "p3", "p4", "p5", "p6"];
const NAMES_BA = [...NAMES_BASE, "avant", "apres"];

const cache = new Map();

async function okId(id) {
  if (cache.has(id)) return cache.get(id);
  const url = `https://images.unsplash.com/photo-${id}?w=1200&q=70&auto=format&fit=crop&fm=jpg`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": "sites-artisans-demo/3.0" },
    });
    const good = res.ok && (res.headers.get("content-type") || "").includes("image");
    const buf = good ? Buffer.from(await res.arrayBuffer()) : null;
    cache.set(id, buf);
    return buf;
  } catch {
    cache.set(id, null);
    return null;
  }
}

async function workingPool(theme) {
  const out = [];
  for (const id of CANDIDATES[theme] || []) {
    const buf = await okId(id);
    if (buf) out.push({ id, buf });
    if (out.length >= 12) break;
  }
  // fill from other themes if short
  if (out.length < 10) {
    for (const list of Object.values(CANDIDATES)) {
      for (const id of list) {
        const buf = await okId(id);
        if (buf && !out.find((x) => x.id === id)) out.push({ id, buf });
        if (out.length >= 12) break;
      }
      if (out.length >= 12) break;
    }
  }
  return out;
}

const root = join(process.cwd(), "public", "img");
mkdirSync(root, { recursive: true });
const credits = [];

for (const [trade, theme] of Object.entries(ASSIGN)) {
  console.log("pool", trade, theme);
  const pool = await workingPool(theme);
  if (pool.length === 0) throw new Error(`No images for ${trade}`);
  const dir = join(root, trade);
  mkdirSync(dir, { recursive: true });
  const names = WITH_BA.has(trade) ? NAMES_BA : NAMES_BASE;
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const dest = join(dir, `${name}.jpg`);
    const item = pool[i % pool.length];
    writeFileSync(dest, item.buf);
    credits.push(`${trade}/${name}.jpg\tUnsplash\thttps://unsplash.com/photos/${item.id}`);
    console.log("ok", trade, name, item.id);
  }
}

writeFileSync(join(root, "CREDITS.txt"), credits.join("\n") + "\n");
console.log("files", readdirSync(root).length, "trades");
