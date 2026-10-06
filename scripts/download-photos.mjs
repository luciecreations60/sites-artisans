import { mkdirSync, writeFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Nommage des fichiers dans public/img/{métier}/ :
 *
 * essentiel_1     hero
 * essentiel_2     à propos
 * essentiel_3…5   réalisations 1…3
 * avance_1        hero
 * avance_2        image secondaire
 * avance_3…8      réalisations 1…6  (doivent coller aux titres/tags)
 * pro_1           hero
 * pro_2 / pro_3   avant / après (projet 1)
 * pro_4…9         réalisations 1…6
 *
 * Les réalisations partagent le même visuel d’un projet entre offres
 * (essentiel_3 = avance_3 = pro_4) pour garder le sens du chantier.
 * Hero / atelier / avant-après restent distincts pour faire voir le
 * changement d’offre dans la barre de démo.
 *
 * Remplace librement les JPG : le GUIDE.md dans chaque dossier indique
 * ce que la photo doit montrer.
 */

/** @type {Record<string, { projects: string[], hero: string, atelier: string, ids: Record<string, string> }>} */
const TRADES = {
  plombier: {
    hero: "Artisan / ambiance plomberie ou salle d’eau",
    atelier: "Atelier ou matériel plomberie / sanitaires",
    projects: [
      "Rénovation salle de bain (pièce terminée)",
      "Douche et robinetterie neuves",
      "Douche à l’italienne",
      "Remise en état point d’eau / fuite réparée",
      "Salle d’eau PMR accessible",
      "Cuisine équipée raccordée (évier / plan)",
    ],
    ids: {
      hero_e: "1584622650111-993a426fbf0a",
      atelier_e: "1507652313519-d4e9174996dd",
      hero_a: "1552321554-5fefe8c9ef14",
      atelier_a: "1620626011761-996317b8d101",
      hero_p: "1600607687939-ce8a6c25118c",
      avant: "1503387762-592deb58ef4e",
      apres: "1552321554-5fefe8c9ef14",
      p1: "1552321554-5fefe8c9ef14",
      p2: "1620626011761-996317b8d101",
      p3: "1600607687939-ce8a6c25118c",
      p4: "1584622650111-993a426fbf0a",
      p5: "1507652313519-d4e9174996dd",
      p6: "1556909114-f6e7ad7d3136",
    },
  },
  electricien: {
    hero: "Électricien au tableau ou chantier électrique",
    atelier: "Local technique / matériel électrique",
    projects: [
      "Tableau électrique neuf",
      "Cuisine tout-électrique",
      "Borne / véhicule électrique",
      "Éclairage baies et terrasse",
      "Appartement rénové (intérieur éclairé)",
      "Bureaux open space câblés",
    ],
    ids: {
      hero_e: "1621905251189-08b45d6a269e",
      atelier_e: "1497366216548-37526070297c",
      hero_a: "1621905251189-08b45d6a269e",
      atelier_a: "1556909114-f6e7ad7d3136",
      hero_p: "1497366216548-37526070297c",
      avant: "1503387762-592deb58ef4e",
      apres: "1618221195710-dd6b41faaea6",
      p1: "1621905251189-08b45d6a269e",
      p2: "1556909114-f6e7ad7d3136",
      p3: "1617788138017-80ad40651399",
      p4: "1600585154340-be6161a56a0c",
      p5: "1493809842364-78817add7ffb",
      p6: "1497366216548-37526070297c",
    },
  },
  couvreur: {
    hero: "Chantier toiture / couvreur",
    atelier: "Structure / charpente / chantier",
    projects: [
      "Toiture tuiles mécaniques",
      "Ardoises / toits en vue large",
      "Lucarne / volume de toit",
      "Gouttières / intervention toiture",
      "Réparation après tempête",
      "Charpente / renfort structure",
    ],
    ids: {
      hero_e: "1504307651254-35680f356dfd",
      atelier_e: "1541888946425-d81bb19240f5",
      hero_a: "1570129477492-45c003edd2be",
      atelier_a: "1449844908441-8829872d2607",
      hero_p: "1504307651254-35680f356dfd",
      avant: "1503387762-592deb58ef4e",
      apres: "1570129477492-45c003edd2be",
      p1: "1570129477492-45c003edd2be",
      p2: "1449844908441-8829872d2607",
      p3: "1564013799919-ab600027ffc6",
      p4: "1504307651254-35680f356dfd",
      p5: "1541888946425-d81bb19240f5",
      p6: "1605276374104-dee2a0ed3cd6",
    },
  },
  peintre: {
    hero: "Rouleau / peintre en action",
    atelier: "Pots de peinture / matériel",
    projects: [
      "Appartement intérieur rénové",
      "Façade / ravalement extérieur",
      "Salon papier peint / déco murale",
      "Bureaux open space peints",
      "Maison neuve finitions",
      "Murs couleur / application peinture",
    ],
    ids: {
      hero_e: "1562259949-e8e7689d7828",
      atelier_e: "1513364776144-60967b0f800f",
      hero_a: "1513364776144-60967b0f800f",
      atelier_a: "1562259949-e8e7689d7828",
      hero_p: "1618221195710-dd6b41faaea6",
      avant: "1503387762-592deb58ef4e",
      apres: "1618221195710-dd6b41faaea6",
      p1: "1618221195710-dd6b41faaea6",
      p2: "1564013799919-ab600027ffc6",
      p3: "1616486338812-3dadae4b4ace",
      p4: "1497366216548-37526070297c",
      p5: "1524758631624-e2822e304c36",
      p6: "1562259949-e8e7689d7828",
    },
  },
  paysagiste: {
    hero: "Paysagiste / jardin en travaux",
    atelier: "Jardin composé / plantation",
    projects: [
      "Jardin méditerranéen (oliviers, gravier, plantes sèches)",
      "Terrasse ombragée / dallage extérieur",
      "Haie brise-vue / clôture / claustra (PAS d’outils seuls)",
      "Massif fleuri",
      "Potager / cultures",
      "Cour minérale / graminées contemporaines",
    ],
    ids: {
      hero_e: "1416879595882-3373a0480b5b",
      atelier_e: "1558904541-efa843a96f01",
      hero_a: "1558904541-efa843a96f01",
      atelier_a: "1416879595882-3373a0480b5b",
      hero_p: "1490750967868-88aa4486c946",
      avant: "1503387762-592deb58ef4e",
      apres: "1558904541-efa843a96f01",
      p1: "1558904541-efa843a96f01",
      p2: "1600585154340-be6161a56a0c",
      // À remplacer idéalement par une vraie haie / claustra bois
      p3: "1564013799919-ab600027ffc6",
      p4: "1490750967868-88aa4486c946",
      p5: "1523348837708-15d4a09cfac2",
      p6: "1500382017468-9049fed747ef",
    },
  },
  garage: {
    hero: "Véhicule / garage",
    atelier: "Atelier mécanique / voiture",
    projects: [
      "Révision citadine",
      "Freinage SUV / véhicule",
      "Intervention moteur / distribution",
      "Habitacle / climatisation",
      "Préparation contrôle technique",
      "Utilitaire / réparation lourde",
    ],
    ids: {
      hero_e: "1492144534655-ae79c964c9d7",
      atelier_e: "1503376780353-7e6692767b70",
      hero_a: "1503376780353-7e6692767b70",
      atelier_a: "1492144534655-ae79c964c9d7",
      hero_p: "1492144534655-ae79c964c9d7",
      avant: "1503376780353-7e6692767b70",
      apres: "1492144534655-ae79c964c9d7",
      p1: "1492144534655-ae79c964c9d7",
      p2: "1503376780353-7e6692767b70",
      p3: "1492144534655-ae79c964c9d7",
      p4: "1503376780353-7e6692767b70",
      p5: "1492144534655-ae79c964c9d7",
      p6: "1503376780353-7e6692767b70",
    },
  },
  boulanger: {
    hero: "Pain / boulangerie",
    atelier: "Viennoiseries / fournil",
    projects: [
      "Miche / pain au levain",
      "Buffet viennoiseries",
      "Pièce montée / gâteau événement",
      "Farandole viennoiseries",
      "Pain spécial",
      "Bûche / pâtisserie fêtes",
    ],
    ids: {
      hero_e: "1509440159596-0249088772ff",
      atelier_e: "1555507036-ab1f4038808a",
      hero_a: "1555507036-ab1f4038808a",
      atelier_a: "1509440159596-0249088772ff",
      hero_p: "1578985545062-69928b1d9587",
      avant: "1509440159596-0249088772ff",
      apres: "1464349095431-e9a21285b5f3",
      p1: "1509440159596-0249088772ff",
      p2: "1555507036-ab1f4038808a",
      p3: "1464349095431-e9a21285b5f3",
      p4: "1555507036-ab1f4038808a",
      p5: "1509440159596-0249088772ff",
      p6: "1578985545062-69928b1d9587",
    },
  },
  coiffure: {
    hero: "Salon de coiffure",
    atelier: "Ciseaux / poste de coiffage",
    projects: [
      "Balayage / couleur",
      "Barbe / coupe homme",
      "Coupe courte structurée",
      "Coiffure événement / chignon",
      "Coloration / soin",
      "Transformation en salon",
    ],
    ids: {
      hero_e: "1560066984-138dadb4c035",
      atelier_e: "1522337360788-8b13dee7a37e",
      hero_a: "1562322140-8baeececf3df",
      atelier_a: "1599351431202-1e0f0137899a",
      hero_p: "1560066984-138dadb4c035",
      avant: "1522337360788-8b13dee7a37e",
      apres: "1562322140-8baeececf3df",
      p1: "1562322140-8baeececf3df",
      p2: "1599351431202-1e0f0137899a",
      p3: "1560066984-138dadb4c035",
      p4: "1562322140-8baeececf3df",
      p5: "1522337360788-8b13dee7a37e",
      p6: "1560066984-138dadb4c035",
    },
  },
  bienetre: {
    hero: "Institut / ambiance spa",
    atelier: "Massage / cabine de soin",
    projects: [
      "Massage / pierres chaudes",
      "Soin visage",
      "Forfait mariée / ambiance détente",
      "Réflexologie / soin corps",
      "Gommage / spa",
      "Atelier relaxation",
    ],
    ids: {
      hero_e: "1540555700478-4be289fbecef",
      atelier_e: "1600334129128-685c5582fd35",
      hero_a: "1570172619644-dfd03ed5d881",
      atelier_a: "1515377905703-c4788e51af15",
      hero_p: "1600334129128-685c5582fd35",
      avant: "1515377905703-c4788e51af15",
      apres: "1540555700478-4be289fbecef",
      p1: "1600334129128-685c5582fd35",
      p2: "1570172619644-dfd03ed5d881",
      p3: "1515377905703-c4788e51af15",
      p4: "1600334129128-685c5582fd35",
      p5: "1540555700478-4be289fbecef",
      p6: "1515377905703-c4788e51af15",
    },
  },
  cordonnier: {
    hero: "Bottes / chaussures cuir",
    atelier: "Chaussure / travail cordonnerie",
    projects: [
      "Bottes cuir resemelées",
      "Escarpins / talons",
      "Sneakers blanches restaurées",
      "Basket running réparée",
      "Chaussures de ville entretenues",
      "Cuir teint / nourri",
    ],
    ids: {
      hero_e: "1608256246200-53e635b5b65f",
      atelier_e: "1549298916-b41d501d3772",
      hero_a: "1543163521-1bf539c55dd2",
      atelier_a: "1460353581641-37baddab0fa2",
      hero_p: "1542291026-7eec264c27ff",
      avant: "1549298916-b41d501d3772",
      apres: "1608256246200-53e635b5b65f",
      p1: "1608256246200-53e635b5b65f",
      p2: "1543163521-1bf539c55dd2",
      p3: "1460353581641-37baddab0fa2",
      p4: "1542291026-7eec264c27ff",
      p5: "1549298916-b41d501d3772",
      p6: "1608256246200-53e635b5b65f",
    },
  },
  serrurier: {
    hero: "Clés + serrure de porte",
    atelier: "Mécanisme / travail de précision métal",
    projects: [
      "Ouverture de porte / clés",
      "Cylindre haute sécurité",
      "Doubles de clés",
      "Serrure multipoints / mécanisme",
      "Porte d’entrée renforcée / habitat",
      "Dépannage clé cassée",
    ],
    ids: {
      hero_e: "flagged/1564767609342-620cb19b2357",
      atelier_e: "1558618666-fcd25c85cd64",
      hero_a: "flagged/1564767609342-620cb19b2357",
      atelier_a: "1558618666-fcd25c85cd64",
      hero_p: "1564013799919-ab600027ffc6",
      avant: "1503387762-592deb58ef4e",
      apres: "flagged/1564767609342-620cb19b2357",
      p1: "flagged/1564767609342-620cb19b2357",
      p2: "flagged/1564767609342-620cb19b2357",
      p3: "flagged/1564767609342-620cb19b2357",
      p4: "1558618666-fcd25c85cd64",
      p5: "1564013799919-ab600027ffc6",
      p6: "flagged/1564767609342-620cb19b2357",
    },
  },
};

function expandFiles(trade) {
  const { ids } = trade;
  /** @type {Record<string, { id: string, tip: string }>} */
  const files = {
    essentiel_1: { id: ids.hero_e, tip: `Hero Essentiel — ${trade.hero}` },
    essentiel_2: { id: ids.atelier_e, tip: `À propos Essentiel — ${trade.atelier}` },
    essentiel_3: { id: ids.p1, tip: `Réalisation 1 — ${trade.projects[0]}` },
    essentiel_4: { id: ids.p2, tip: `Réalisation 2 — ${trade.projects[1]}` },
    essentiel_5: { id: ids.p3, tip: `Réalisation 3 — ${trade.projects[2]}` },
    avance_1: { id: ids.hero_a, tip: `Hero Avancé — ${trade.hero}` },
    avance_2: { id: ids.atelier_a, tip: `Image secondaire Avancé — ${trade.atelier}` },
    avance_3: { id: ids.p1, tip: `Réalisation 1 — ${trade.projects[0]}` },
    avance_4: { id: ids.p2, tip: `Réalisation 2 — ${trade.projects[1]}` },
    avance_5: { id: ids.p3, tip: `Réalisation 3 — ${trade.projects[2]}` },
    avance_6: { id: ids.p4, tip: `Réalisation 4 — ${trade.projects[3]}` },
    avance_7: { id: ids.p5, tip: `Réalisation 5 — ${trade.projects[4]}` },
    avance_8: { id: ids.p6, tip: `Réalisation 6 — ${trade.projects[5]}` },
    pro_1: { id: ids.hero_p, tip: `Hero Pro — ${trade.hero}` },
    pro_2: { id: ids.avant, tip: `Avant (projet 1) — chantier / état initial` },
    pro_3: { id: ids.apres, tip: `Après (projet 1) — ${trade.projects[0]}` },
    pro_4: { id: ids.p1, tip: `Réalisation 1 — ${trade.projects[0]}` },
    pro_5: { id: ids.p2, tip: `Réalisation 2 — ${trade.projects[1]}` },
    pro_6: { id: ids.p3, tip: `Réalisation 3 — ${trade.projects[2]}` },
    pro_7: { id: ids.p4, tip: `Réalisation 4 — ${trade.projects[3]}` },
    pro_8: { id: ids.p5, tip: `Réalisation 5 — ${trade.projects[4]}` },
    pro_9: { id: ids.p6, tip: `Réalisation 6 — ${trade.projects[5]}` },
  };
  return files;
}

function photoUrl(id) {
  if (id.startsWith("flagged/")) {
    return `https://images.unsplash.com/flagged/photo-${id.slice("flagged/".length)}?w=1200&q=70&auto=format&fit=crop&fm=jpg`;
  }
  return `https://images.unsplash.com/photo-${id}?w=1200&q=70&auto=format&fit=crop&fm=jpg`;
}

const cache = new Map();

async function fetchPhoto(id) {
  if (cache.has(id)) return cache.get(id);
  try {
    const res = await fetch(photoUrl(id), {
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

const root = join(process.cwd(), "public", "img");
mkdirSync(root, { recursive: true });

const keep = new Set(Object.keys(TRADES));
for (const name of readdirSync(root)) {
  const p = join(root, name);
  if (statSync(p).isDirectory() && !keep.has(name)) {
    rmSync(p, { recursive: true, force: true });
    console.log("removed", name);
  }
}

const credits = [];
const rootGuide = [
  "# Photos démos — guide de remplacement",
  "",
  "Chaque métier a un dossier `public/img/{métier}/` avec des fichiers nommés :",
  "",
  "| Fichier | Rôle |",
  "|---|---|",
  "| `essentiel_1.jpg` | Hero page Essentiel |",
  "| `essentiel_2.jpg` | À propos / atelier Essentiel |",
  "| `essentiel_3…5.jpg` | Réalisations 1…3 Essentiel |",
  "| `avance_1.jpg` | Hero Avancé |",
  "| `avance_2.jpg` | Image secondaire Accueil Avancé |",
  "| `avance_3…8.jpg` | Réalisations 1…6 Avancé (filtres inclus) |",
  "| `pro_1.jpg` | Hero Pro |",
  "| `pro_2.jpg` / `pro_3.jpg` | Avant / Après du projet 1 |",
  "| `pro_4…9.jpg` | Réalisations 1…6 Pro |",
  "",
  "Remplace simplement le JPG (même nom). Voir le `GUIDE.md` dans chaque métier pour le sujet exact.",
  "",
];

let failures = 0;

for (const [slug, trade] of Object.entries(TRADES)) {
  console.log("trade", slug);
  const dir = join(root, slug);
  mkdirSync(dir, { recursive: true });

  // purge old naming
  for (const old of readdirSync(dir)) {
    if (!/^(essentiel|avance|pro)_\d+\.jpg$|^GUIDE\.md$/.test(old)) {
      rmSync(join(dir, old), { force: true });
    }
  }

  const files = expandFiles(trade);
  const guideLines = [`# Photos — ${slug}`, "", "Remplace les fichiers ci-dessous (garde le même nom).", ""];

  for (const [name, meta] of Object.entries(files)) {
    const buf = await fetchPhoto(meta.id);
    if (!buf) {
      console.error("FAIL", slug, name, meta.id);
      failures += 1;
      guideLines.push(`- **${name}.jpg** — ${meta.tip} _(téléchargement échoué — à ajouter manuellement)_`);
      continue;
    }
    writeFileSync(join(dir, `${name}.jpg`), buf);
    const cleanId = meta.id.startsWith("flagged/") ? meta.id.slice("flagged/".length) : meta.id;
    credits.push(`${slug}/${name}.jpg\tUnsplash\thttps://unsplash.com/photos/${cleanId}`);
    guideLines.push(`- **${name}.jpg** — ${meta.tip}`);
    console.log("ok", slug, name);
  }

  guideLines.push("");
  writeFileSync(join(dir, "GUIDE.md"), guideLines.join("\n"));
  rootGuide.push(`- [${slug}](./${slug}/GUIDE.md)`);
}

writeFileSync(join(root, "CREDITS.txt"), credits.join("\n") + "\n");
writeFileSync(join(root, "GUIDE.md"), rootGuide.join("\n") + "\n");
console.log("done", failures ? `(${failures} failures)` : "ok");
if (failures) process.exit(1);
