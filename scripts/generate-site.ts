/**
 * CLI de génération locale — Lot 6.
 * Usage :
 *   npm run generate:site -- --fixture=essentiel
 *   npm run generate:site -- --fixture=avance --out=generated-sites/demo-avance
 *   npm run generate:site -- --fixture=pro
 *
 * Ne déploie rien. N’utilise pas Supabase. Aucun faux succès.
 */
import { resolve } from "node:path";
import { fixtureJob, generateSiteFromJob } from "../app/lib/production/generate.ts";

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

const fixture = arg("fixture") ?? "essentiel";
const out =
  arg("out") ??
  resolve(process.cwd(), "generated-sites", `fixture-${fixture}`);

const job = fixtureJob(fixture);
const result = generateSiteFromJob(job, out, { clean: true });

if (!result.ok) {
  console.error("ÉCHEC — génération refusée ou invalide (pas de faux succès).");
  console.error(result.error);
  if (result.details?.length) {
    for (const d of result.details) console.error(` - ${d}`);
  }
  process.exit(1);
}

console.log("OK — site généré localement");
console.log(` Dossier : ${result.outputDir}`);
console.log(` Fichiers : ${result.filesWritten.join(", ")}`);
console.log(` Template : ${result.config.templateVersion}`);
console.log(` Formule  : ${result.config.planId}`);
if (result.config.isTestFixture) {
  console.log(" ATTENTION : fixture TEST — ne pas publier comme site client.");
}
if (result.warnings.length) {
  console.log(" Avertissements :");
  for (const w of result.warnings) console.log(` - ${w}`);
}
