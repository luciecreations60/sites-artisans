/**
 * Adapt the static build for GitHub Pages project URL
 * https://luciecreations60.github.io/sites-artisans/
 *
 * React Router 8 currently crashes when combining vite `base` + basename + prerender,
 * so we build at `/` then rewrite paths.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "build", "client");
const BASE = "/sites-artisans";

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

if (!existsSync(ROOT)) {
  console.error("Missing build/client — run npm run build first");
  process.exit(1);
}

const files = walk(ROOT).filter((f) => /\.(html|js|css|json|txt|map)$/i.test(f));

for (const file of files) {
  let text = readFileSync(file, "utf8");
  const before = text;

  // Router basename for client hydration
  text = text.replaceAll('"basename":"/"', `"basename":"${BASE}"`);
  text = text.replaceAll('"basename": "/"', `"basename": "${BASE}"`);

  // Absolute asset / public URLs
  text = text.replaceAll('"/assets/', `"${BASE}/assets/`);
  text = text.replaceAll("'/assets/", `'${BASE}/assets/`);
  text = text.replaceAll("(/assets/", `(${BASE}/assets/`);
  text = text.replaceAll('href="/assets/', `href="${BASE}/assets/`);
  text = text.replaceAll('src="/assets/', `src="${BASE}/assets/`);
  text = text.replaceAll('href="/img/', `href="${BASE}/img/`);
  text = text.replaceAll('src="/img/', `src="${BASE}/img/`);
  text = text.replaceAll('"/img/', `"${BASE}/img/`);
  text = text.replaceAll("'/img/", `'${BASE}/img/`);

  // In-HTML navigation links produced by prerender
  text = text.replaceAll('href="/"', `href="${BASE}/"`);
  text = text.replaceAll('href="/offres', `href="${BASE}/offres`);
  text = text.replaceAll('href="/demos', `href="${BASE}/demos`);
  text = text.replaceAll('href="/comparatif', `href="${BASE}/comparatif`);
  text = text.replaceAll('href="/contact', `href="${BASE}/contact`);
  text = text.replaceAll('href="/espace-client', `href="${BASE}/espace-client`);
  text = text.replaceAll('href="/mentions-legales', `href="${BASE}/mentions-legales`);
  text = text.replaceAll('href="/cgv', `href="${BASE}/cgv`);
  text = text.replaceAll('href="/confidentialite', `href="${BASE}/confidentialite`);

  if (text !== before) writeFileSync(file, text);
}

const index = join(ROOT, "index.html");
const spa404 = join(ROOT, "404.html");
if (existsSync(index)) copyFileSync(index, spa404);
writeFileSync(join(ROOT, ".nojekyll"), "");

console.log(`Prepared GitHub Pages under ${BASE} (${files.length} files scanned)`);
