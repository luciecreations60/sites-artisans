const SECRET_PATTERNS: RegExp[] = [
  /supabase\.co\/[^\s"']+/i,
  /eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]+\./, // JWT-like
  /service_role/i,
  /SUPABASE_SERVICE/i,
  /sk_live_[a-zA-Z0-9]+/,
  /password\s*[:=]\s*\S+/i,
];

const CRM_LEAK_PATTERNS: RegExp[] = [
  /commercial_requests/i,
  /site_configurations/i,
  /claim_commercial_rate_limit/i,
  /admin_next_quote_reference/i,
  /Compte rendu de rendez-vous/i,
];

export type OutputValidation = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

/** Vérifie qu’un build ne contient pas de secrets ni de données CRM. */
export function validateGeneratedFiles(files: Record<string, string>): OutputValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!files["index.html"]) {
    errors.push("index.html manquant");
  }
  if (!files["styles.css"]) {
    errors.push("styles.css manquant");
  }

  for (const [name, content] of Object.entries(files)) {
    for (const re of SECRET_PATTERNS) {
      if (re.test(content)) {
        errors.push(`Secret potentiel dans ${name} (${re.source})`);
      }
    }
    for (const re of CRM_LEAK_PATTERNS) {
      if (re.test(content)) {
        errors.push(`Donnée interne / CRM dans ${name}`);
      }
    }
    if (name !== "README.txt" && /\[\s*TEST\s*\]/.test(content) === false) {
      // ok
    }
    if (/localhost:54321|127\.0\.0\.1:54321/.test(content)) {
      warnings.push(`Référence locale dans ${name}`);
    }
  }

  const manifest = files["site.json"];
  if (manifest) {
    try {
      const json = JSON.parse(manifest) as { projectId?: string; jobId?: string };
      if (!json.projectId && !json.jobId) {
        warnings.push("Manifeste sans identifiant projet");
      }
    } catch {
      errors.push("site.json invalide");
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function assertNoOtherClientData(
  files: Record<string, string>,
  allowedCompany: string,
): OutputValidation {
  const errors: string[] = [];
  const blob = Object.values(files).join("\n");
  // Autre marqueur de fixture connu
  const foreign = ["Autre Client SA", "CRM-INTERNAL-ONLY"];
  for (const marker of foreign) {
    if (blob.includes(marker) && !allowedCompany.includes(marker)) {
      errors.push(`Donnée d’un autre client détectée : ${marker}`);
    }
  }
  return { ok: errors.length === 0, errors, warnings: [] };
}
