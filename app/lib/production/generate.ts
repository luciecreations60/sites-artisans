import { mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  productionJobToBuildConfig,
  type SiteBuildConfig,
} from "./buildConfig.ts";
import { renderSiteHtml } from "./renderSite.ts";
import {
  assertNoOtherClientData,
  validateGeneratedFiles,
} from "./validateOutput.ts";
import { evaluateProductionEligibility, assertHonestGenerationResult } from "./eligibility.ts";
import type { ProductionJob } from "./types.ts";
import {
  createTestAvanceJob,
  createTestProJob,
  createTestProductionJob,
} from "./fixtures.ts";

export type GenerateResult =
  | {
      ok: true;
      outputDir: string;
      config: SiteBuildConfig;
      filesWritten: string[];
      warnings: string[];
    }
  | {
      ok: false;
      error: string;
      details?: string[];
    };

/**
 * Ne jamais écraser silencieusement une version marquée livrée.
 * Si le dossier contient DELIVERED.flag et protectDelivered, écrit dans un sous-dossier horodaté.
 */
export function resolveVersionedOutputDir(
  outputDir: string,
  opts: { clean: boolean; protectDelivered: boolean },
): string {
  const deliveredFlag = join(outputDir, "DELIVERED.flag");
  if (opts.protectDelivered && existsSync(deliveredFlag)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    return join(outputDir, `v-${stamp}`);
  }
  if (opts.clean && existsSync(outputDir) && !existsSync(deliveredFlag)) {
    rmSync(outputDir, { recursive: true, force: true });
  }
  return outputDir;
}

export function fixtureJob(name: string): ProductionJob {
  if (name === "avance") return createTestAvanceJob();
  if (name === "pro") return createTestProJob();
  return createTestProductionJob();
}

/**
 * Génère un site statique sur disque.
 * Ne prétend jamais réussir sans fichiers écrits et validés.
 */
export function generateSiteFromJob(
  job: ProductionJob,
  outputDir: string,
  opts?: { quoteAccepted?: boolean; clean?: boolean; protectDelivered?: boolean },
): GenerateResult {
  const elig = evaluateProductionEligibility(job, {
    quoteAccepted: opts?.quoteAccepted ?? Boolean(job.config.acceptedQuoteReference),
  });
  if (!elig.ok) {
    return {
      ok: false,
      error: "Génération refusée",
      details: elig.reasons,
    };
  }

  const config = productionJobToBuildConfig(job);
  const { files } = renderSiteHtml(config);

  const validation = validateGeneratedFiles(files);
  const isolation = assertNoOtherClientData(files, config.companyName);
  if (!validation.ok || !isolation.ok) {
    return {
      ok: false,
      error: "Validation du build échouée — aucun dossier écrit",
      details: [...validation.errors, ...isolation.errors],
    };
  }

  try {
    const targetDir = resolveVersionedOutputDir(outputDir, {
      clean: opts?.clean ?? false,
      protectDelivered: opts?.protectDelivered ?? true,
    });
    mkdirSync(targetDir, { recursive: true });
    const written: string[] = [];
    for (const [name, content] of Object.entries(files)) {
      const path = join(targetDir, name);
      writeFileSync(path, content, "utf8");
      written.push(name);
    }

    const honest = assertHonestGenerationResult({
      attempted: true,
      outputExists: existsSync(join(targetDir, "index.html")),
      errorMessage: null,
    });
    if (!honest.success) {
      return { ok: false, error: honest.message };
    }

    return {
      ok: true,
      outputDir: targetDir,
      config,
      filesWritten: written,
      warnings: validation.warnings,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur d’écriture",
    };
  }
}

/** Génération en mémoire (tests) sans I/O. */
export function generateSiteInMemory(job: ProductionJob): {
  ok: boolean;
  files: Record<string, string>;
  config: SiteBuildConfig;
  errors: string[];
} {
  const config = productionJobToBuildConfig(job);
  const { files } = renderSiteHtml(config);
  const validation = validateGeneratedFiles(files);
  const isolation = assertNoOtherClientData(files, config.companyName);
  return {
    ok: validation.ok && isolation.ok,
    files,
    config,
    errors: [...validation.errors, ...isolation.errors],
  };
}
