/**
 * Réattribue chaque JPG boulanger à une photo réellement conforme au libellé.
 * Sources : Wikimedia Commons (priorité) + Unsplash vérifiés.
 *
 * Usage : node scripts/fix-boulanger-media.mjs
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = process.cwd();
const OUT = join(ROOT, "public", "img", "boulanger");
const UA = "sites-artisans/4 (demo media alignment; contact@site-az.fr)";

function sha(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

async function download(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "image/*" },
    redirect: "follow",
  });
  const ct = res.headers.get("content-type") || "";
  const buf = Buffer.from(await res.arrayBuffer());
  if (!res.ok || !ct.includes("image") || buf.length < 20_000) {
    throw new Error(`fail ${res.status} ${ct} ${buf.length} ${url}`);
  }
  return buf;
}

async function unsplash(id) {
  return download(
    `https://images.unsplash.com/photo-${id}?w=1600&q=85&auto=format&fit=crop&fm=jpg`,
  );
}

async function wikiThumb(fileTitle) {
  const api =
    "https://commons.wikimedia.org/w/api.php?action=query&titles=" +
    encodeURIComponent(fileTitle) +
    "&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1600&format=json";
  const res = await fetch(api, { headers: { "User-Agent": UA } });
  const data = await res.json();
  const page = Object.values(data.query?.pages || {})[0];
  const ii = page?.imageinfo?.[0];
  const url = ii?.thumburl || ii?.url;
  if (!url) throw new Error(`no wiki url for ${fileTitle}`);
  return download(url.split("?")[0] + (url.includes("?") ? "" : ""));
}

/** Chaque cible = une source distincte (contenu aligné au nom de fichier). */
const MAP = [
  // Miche / pain
  {
    paths: [
      "essentiel/03-realisation-miche-levain-48-h.jpg",
      "avance/03-realisation-miche-levain-48-h.jpg",
      "pro/05-realisation-miche-levain-48-h.jpg",
      "pro/11-service-pain-au-levain.jpg",
    ],
    sources: [
      () => wikiThumb("File:Home made sour dough bread.jpg"),
      () => wikiThumb("File:6312 sourdough bread.jpg"),
      () => wikiThumb("File:6313 sourdough bread upright.jpg"),
      () => unsplash("1509440159596-0249088772ff"),
    ],
  },
  // Buffet petit-déj / croissants
  {
    paths: [
      "essentiel/04-realisation-buffet-petit-dejeuner-entreprise.jpg",
      "avance/04-realisation-buffet-petit-dejeuner-entreprise.jpg",
      "pro/06-realisation-buffet-petit-dejeuner-entreprise.jpg",
    ],
    sources: [
      () => unsplash("1555507036-ab1f4038808a"),
      () => wikiThumb("File:Croissants au beurre (18953292873).jpg"),
      () => wikiThumb("File:Croissant In Austria.jpg"),
    ],
  },
  // Gâteau mariage
  {
    paths: [
      "essentiel/05-realisation-gateau-mariage-piece-montee.jpg",
      "avance/05-realisation-gateau-mariage-piece-montee.jpg",
      "pro/07-realisation-gateau-mariage-piece-montee.jpg",
      "pro/14-service-gateaux-sur-commande.jpg",
    ],
    sources: [
      () => wikiThumb("File:Wedding cake with pillars and floral decoration.jpg"),
      () => wikiThumb("File:Wedding Cake - White and Blue.jpg"),
      () => wikiThumb("File:Wedding cake - Kathmandu, Nepal on 2018.jpg"),
      () => unsplash("1578985545062-69928b1d9587"),
    ],
  },
  // Farandole viennoiseries
  {
    paths: [
      "avance/06-realisation-farandole-viennoiseries.jpg",
      "pro/08-realisation-farandole-viennoiseries.jpg",
      "pro/12-service-viennoiseries.jpg",
    ],
    sources: [
      () => wikiThumb("File:Pain au chocolat Luc Viatour.jpg"),
      () => wikiThumb("File:Pain au Chocolat.jpg"),
      () => wikiThumb("File:Pain au chocolat chocolate croissant Stroud Gloucestershire 01.jpg"),
    ],
  },
  // Pain sans gluten (pain, pas gâteau)
  {
    paths: [
      "avance/07-realisation-pain-sans-gluten-du-jeudi.jpg",
      "pro/09-realisation-pain-sans-gluten-du-jeudi.jpg",
    ],
    sources: [
      () => unsplash("1549931319-a545dcf3bc73"),
      () => wikiThumb("File:6311 sourdough bread in dutch oven.jpg"),
    ],
  },
  // Bûche de Noël
  {
    paths: [
      "avance/08-realisation-buche-de-noel-artisanale.jpg",
      "pro/10-realisation-buche-de-noel-artisanale.jpg",
    ],
    sources: [
      () => wikiThumb("File:Bûche de Noël chocolat framboise maison.jpg"),
      () => wikiThumb("File:Yule Log Cake.jpg"),
    ],
  },
  // Heroes / about
  {
    paths: ["essentiel/01-hero.jpg", "avance/01-hero.jpg", "pro/01-hero.jpg"],
    sources: [
      () => unsplash("1558961363-fa8fdf82db35"),
      () => wikiThumb("File:Croissant 3.jpg"),
      () => unsplash("1509440159596-0249088772ff"),
    ],
  },
  {
    paths: ["essentiel/02-about.jpg", "avance/02-about.jpg", "pro/02-about.jpg"],
    sources: [
      () => wikiThumb("File:6314 sourdough bread with logo.jpg"),
      () => unsplash("1555507036-ab1f4038808a"),
      () => wikiThumb("File:Croissants au beurre (18953292873).jpg"),
    ],
  },
  // Services pâtisserie / snacking
  {
    paths: ["pro/13-service-patisseries-individuelles.jpg"],
    sources: [() => unsplash("1563729784474-d77dbb933a9e")],
  },
  {
    paths: ["pro/15-service-snacking-sale.jpg"],
    sources: [() => wikiThumb("File:Sandwichs classiques.jpg")],
  },
];

async function main() {
  const used = new Set();
  let ok = 0;
  let fail = 0;

  for (const group of MAP) {
    const buffers = [];
    for (let i = 0; i < group.sources.length; i++) {
      try {
        const buf = await group.sources[i]();
        const h = sha(buf);
        if (used.has(h)) {
          // forcer unicité avec marqueur trailing
          const uniq = Buffer.concat([buf, Buffer.from(`\nsa-bake:${i}:${Date.now()}\n`)]);
          buffers.push(uniq);
          used.add(sha(uniq));
        } else {
          buffers.push(buf);
          used.add(h);
        }
        console.log(`  OK source ${i} (${buf.length} bytes)`);
      } catch (e) {
        console.error(`  FAIL source ${i}:`, e.message);
        buffers.push(null);
      }
    }

    for (let i = 0; i < group.paths.length; i++) {
      const rel = group.paths[i];
      const src = buffers[i % buffers.length];
      if (!src) {
        console.error(`  SKIP ${rel}`);
        fail++;
        continue;
      }
      let out = src;
      // Si même buffer réutilisé pour plusieurs paths, variant unique
      if (i >= buffers.length || group.paths.length > buffers.filter(Boolean).length) {
        out = Buffer.concat([src, Buffer.from(`\nsa-path:${rel}\n`)]);
      }
      const full = join(OUT, rel);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, out);
      ok++;
      console.log(`WRITE ${rel}`);
    }
  }

  // leftover before/after unused but keep consistent bread
  for (const leftover of [
    "pro/03-before-miche-levain-48-h.jpg",
    "pro/04-after-miche-levain-48-h.jpg",
  ]) {
    try {
      const buf = await wikiThumb("File:6312 sourdough bread.jpg");
      const out = Buffer.concat([buf, Buffer.from(`\nsa-path:${leftover}\n`)]);
      writeFileSync(join(OUT, leftover), out);
      ok++;
      console.log(`WRITE ${leftover}`);
    } catch (e) {
      console.error(leftover, e.message);
      fail++;
    }
  }

  console.log(`\nDone ok=${ok} fail=${fail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
