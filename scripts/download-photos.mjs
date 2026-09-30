import { mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Photos assignées par métier et par rôle (hero, atelier, projets).
 * Les IDs Unsplash sont choisis pour coller au texte affiché à côté.
 */
const SLOTS = {
  menuisier: {
    hero: "1601058268499-e52658b8bb88", // artisan au travail
    atelier: "1452860606245-08befc0ff44b", // atelier bois
    p1: "1516972810927-80185027ca84", // escalier intérieur
    p2: "1600585154340-be6161a56a0c", // baies / lumière maison
    p3: "1556912167-f556f1f39fdf", // rangements cuisine/placards
    p4: "1600566753190-17f0baa2a6c3", // porte / entrée
    p5: "1524758631624-e2822e304c36", // bibliothèque / intérieur bois
    p6: "1618221195710-dd6b41faaea6", // extension lumineuse
  },
  plombier: {
    hero: "1584622650111-993a426fbf0a",
    atelier: "1507652313519-d4e9174996dd",
    p1: "1552321554-5fefe8c9ef14",
    p2: "1493809842364-78817add7ffb",
    p3: "1600566753190-17f0baa2a6c3",
    p4: "1616486338812-3dadae4b4ace",
    p5: "1615874959474-d163d25d8f7c",
    p6: "1600585154340-be6161a56a0c",
    avant: "1503387762-592deb58ef4e",
    apres: "1600585154340-be6161a56a0c",
  },
  electricien: {
    hero: "1621905251189-08b45d6a269e",
    atelier: "1621905252507-b35492ae6964",
    p1: "1558002038-1055907dfad0",
    p2: "1497366216548-37526070297c",
    p3: "1473341304170-971dccb5ac1e",
    p4: "1513828586688-f87b4c7b55c0",
    p5: "1564013799919-ab600027ffc6",
    p6: "1605276374104-dee2a0ed3cd6",
  },
  couvreur: {
    hero: "1504307651254-35680f356dfd",
    atelier: "1541888946425-d81bb19240f5",
    p1: "1570129477492-45c003edd2be",
    p2: "1564013799919-ab600027ffc6",
    p3: "1449844908441-8829872d2607",
    p4: "1605276374104-dee2a0ed3cd6",
    p5: "1486406146926-c627a92ad1ab",
    p6: "1503387762-592deb58ef4e",
  },
  peintre: {
    hero: "1562259949-e8e7689d7828",
    atelier: "1589939705384-5184d4a2c0e6",
    p1: "1618221195710-dd6b41faaea6",
    p2: "1616486338812-3dadae4b4ace",
    p3: "1600585154340-be6161a56a0c",
    p4: "1493809842364-78817add7ffb",
    p5: "1524758631624-e2822e304c36",
    p6: "1615874959474-d163d25d8f7c",
    avant: "1503387762-592deb58ef4e",
    apres: "1618221195710-dd6b41faaea6",
  },
  paysagiste: {
    hero: "1416879595882-3373a0480b5b",
    atelier: "1585320806299-c0b6cdee6a1b",
    p1: "1466692476866-a8051ffd6c4c",
    p2: "1500382017468-9049fed747ef",
    p3: "1416879595882-3373a0480b5b",
    p4: "1585320806299-c0b6cdee6a1b",
    p5: "1466692476866-a8051ffd6c4c",
    p6: "1500382017468-9049fed747ef",
    avant: "1503387762-592deb58ef4e",
    apres: "1416879595882-3373a0480b5b",
  },
  macon: {
    hero: "1504307651254-35680f356dfd",
    atelier: "1541888946425-d81bb19240f5",
    p1: "1564013799919-ab600027ffc6",
    p2: "1570129477492-45c003edd2be",
    p3: "1605276374104-dee2a0ed3cd6",
    p4: "1449844908441-8829872d2607",
    p5: "1486406146926-c627a92ad1ab",
    p6: "1513585711002-0825bce3b8c5",
    avant: "1503387762-592deb58ef4e",
    apres: "1564013799919-ab600027ffc6",
  },
  garage: {
    hero: "1492144534655-ae79c964c9d7",
    atelier: "1486262715619-67efe4c5f0c0",
    p1: "1503376780353-7e6692767b70",
    p2: "1492144534655-ae79c964c9d7",
    p3: "1486262715619-67efe4c5f0c0",
    p4: "1503376780353-7e6692767b70",
    p5: "1492144534655-ae79c964c9d7",
    p6: "1486262715619-67efe4c5f0c0",
    avant: "1486262715619-67efe4c5f0c0",
    apres: "1492144534655-ae79c964c9d7",
  },
  boulanger: {
    hero: "1509440159596-0249088772ff",
    atelier: "1517433670267-08bbd4be890f",
    p1: "1555507036-ab1f4038808a",
    p2: "1578985545062-69928b1d9587",
    p3: "1464349095431-e9a21285b5f3",
    p4: "1509440159596-0249088772ff",
    p5: "1517433670267-08bbd4be890f",
    p6: "1555507036-ab1f4038808a",
  },
  coiffure: {
    hero: "1560066984-138dadb4c035",
    atelier: "1522337360788-8b13dee7a37e",
    p1: "1562322140-8baeececf3df",
    p2: "1493256338651-d37fabe471c0c",
    p3: "1560066984-138dadb4c035",
    p4: "1522337360788-8b13dee7a37e",
    p5: "1562322140-8baeececf3df",
    p6: "1493256338651-d37fabe471c0c",
  },
  bienetre: {
    hero: "1540555700478-4be289fbecef",
    atelier: "1544168190-a16b35daf4f0",
    p1: "1515377905703-c4788e51af15",
    p2: "1570172619644-dfd03ed5d881",
    p3: "1600334129128-685c5582fd35",
    p4: "1540555700478-4be289fbecef",
    p5: "1544168190-a16b35daf4f0",
    p6: "1515377905703-c4788e51af15",
  },
  autre: {
    hero: "1452860606245-08befc0ff44b",
    atelier: "1513364776144-60967b0f800f",
    p1: "1541123437800-1bb1317badc2",
    p2: "1524758631624-e2822e304c36",
    p3: "1600585154340-be6161a56a0c",
    p4: "1618221195710-dd6b41faaea6",
    p5: "1493809842364-78817add7ffb",
    p6: "1565182999561-18d7dc61c393",
  },
};

const FALLBACK_IDS = [
  "1600585154340-be6161a56a0c",
  "1618221195710-dd6b41faaea6",
  "1493809842364-78817add7ffb",
  "1524758631624-e2822e304c36",
];

const cache = new Map();

async function fetchPhoto(id) {
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

async function resolveBuf(preferredId) {
  let buf = await fetchPhoto(preferredId);
  if (buf) return { id: preferredId, buf };
  for (const id of FALLBACK_IDS) {
    buf = await fetchPhoto(id);
    if (buf) return { id, buf };
  }
  throw new Error(`Impossible de télécharger la photo ${preferredId}`);
}

const root = join(process.cwd(), "public", "img");
mkdirSync(root, { recursive: true });
const credits = [];

for (const [trade, slots] of Object.entries(SLOTS)) {
  console.log("trade", trade);
  const dir = join(root, trade);
  mkdirSync(dir, { recursive: true });
  for (const [name, id] of Object.entries(slots)) {
    const item = await resolveBuf(id);
    writeFileSync(join(dir, `${name}.jpg`), item.buf);
    credits.push(`${trade}/${name}.jpg\tUnsplash\thttps://unsplash.com/photos/${item.id}`);
    console.log("ok", trade, name, item.id);
  }
}

writeFileSync(join(root, "CREDITS.txt"), credits.join("\n") + "\n");
console.log("done", readdirSync(root).length, "entries");
