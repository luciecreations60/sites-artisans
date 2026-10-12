/**
 * CLI de génération locale — Lots 6–7.
 * Usage :
 *   npm run generate:site -- --fixture=essentiel
 *   npm run generate:site -- --fixture=avance --out=generated-sites/demo-avance
 *   npm run generate:site -- --job-file=path/to/job.json --out=generated-sites/client
 *
 * Ne déploie rien. Aucun faux succès.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fixtureJob, generateSiteFromJob } from "../app/lib/production/generate.ts";
import type { ProductionJob } from "../app/lib/production/types.ts";

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

const fixture = arg("fixture");
const jobFile = arg("job-file");
const out =
  arg("out") ??
  resolve(
    process.cwd(),
    "generated-sites",
    jobFile ? "from-job" : `fixture-${fixture ?? "essentiel"}`,
  );

let job: ProductionJob;
if (jobFile) {
  try {
    job = JSON.parse(readFileSync(resolve(jobFile), "utf8")) as ProductionJob;
  } catch (e) {
    console.error("ÉCHEC — impossible de lire --job-file");
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }
} else {
  job = fixtureJob(fixture ?? "essentiel");
}

const result = generateSiteFromJob(job, out, {
  clean: true,
  quoteAccepted: Boolean(job.config?.acceptedQuoteReference) || job.isTestFixture,
});

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
