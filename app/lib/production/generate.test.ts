import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  createIncompleteLiveJob,
  createTestAvanceJob,
  createTestProJob,
  createTestProductionJob,
} from "./fixtures.ts";
import { generateSiteFromJob, generateSiteInMemory } from "./generate.ts";
import { resolveBuildModules } from "./buildConfig.ts";
import { validateGeneratedFiles } from "./validateOutput.ts";

describe("génération sites", () => {
  it("génère Essentiel à partir de données seules (fixture)", () => {
    const job = createTestProductionJob();
    const res = generateSiteInMemory(job);
    assert.equal(res.ok, true);
    assert.ok(res.files["index.html"]);
    assert.ok(res.files["styles.css"]);
    assert.ok(res.files["index.html"].includes(job.companyName.replace(/&/g, "&amp;")) || res.files["index.html"].includes("Dupont"));
    assert.equal(res.config.planId, "essentiel");
    assert.ok(!res.files["services.html"]);
  });

  it("génère Avancé multipage", () => {
    const res = generateSiteInMemory(createTestAvanceJob());
    assert.equal(res.ok, true);
    assert.ok(res.files["services.html"]);
    assert.ok(res.files["contact.html"]);
    assert.ok(res.config.modules.includes("quote_form"));
  });

  it("génère Pro avec modules avancés", () => {
    const res = generateSiteInMemory(createTestProJob());
    assert.equal(res.ok, true);
    assert.ok(res.config.modules.includes("estimator"));
    assert.ok(res.config.modules.includes("gallery_before_after"));
    assert.ok(res.files["index.html"].includes("estimateur") || res.files["index.html"].includes("Avant"));
  });

  it("n’embarque pas de clés secrètes", () => {
    const res = generateSiteInMemory(createTestProductionJob());
    const poisoned = {
      ...res.files,
      "evil.html": "service_role key eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaa.bbb",
    };
    const v = validateGeneratedFiles(poisoned);
    assert.equal(v.ok, false);
  });

  it("n’embarque pas le contenu d’un autre client", () => {
    const res = generateSiteInMemory(createTestProductionJob());
    assert.ok(!Object.values(res.files).join("").includes("CRM-INTERNAL-ONLY"));
  });

  it("active les modules prévus et ignore les non développés", () => {
    const { modules, skipped } = resolveBuildModules("essentiel", [
      "gallery_basic",
      "fantasy_module_xyz",
    ]);
    assert.ok(modules.includes("gallery_basic"));
    assert.ok(skipped.includes("fantasy_module_xyz"));
  });

  it("signale les images absentes sans faux médias démo", () => {
    const job = createTestProductionJob();
    job.content.photoCount = 0;
    const res = generateSiteInMemory(job);
    assert.ok(res.files["index.html"].includes("Photos manquantes"));
    assert.ok(!res.files["index.html"].includes("/demos/"));
  });

  it("fonctionne sans base distante avec fixtures", () => {
    const job = createTestProductionJob({ backendAvailable: false });
    const res = generateSiteInMemory(job);
    assert.equal(res.ok, true);
  });

  it("échoue sans faux succès si non éligible", () => {
    const dir = mkdtempSync(join(tmpdir(), "sa-gen-"));
    try {
      const res = generateSiteFromJob(createIncompleteLiveJob(), dir);
      assert.equal(res.ok, false);
      if (!res.ok) assert.ok(res.details?.length);
      assert.equal(existsSync(join(dir, "index.html")), false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("export reproductible (même config → mêmes modules / pages)", () => {
    const job = createTestProductionJob();
    const a = generateSiteInMemory(job);
    const b = generateSiteInMemory(job);
    assert.deepEqual(Object.keys(a.files).sort(), Object.keys(b.files).sort());
    assert.deepEqual(a.config.modules, b.config.modules);
    // generatedAt diffère — comparer hors horodatage
    const strip = (html: string) => html.replace(/Généré [^·]+/g, "Généré DATE");
    assert.equal(strip(a.files["index.html"]), strip(b.files["index.html"]));
  });

  it("écrit réellement un dossier local pour Essentiel", () => {
    const dir = mkdtempSync(join(tmpdir(), "sa-gen-ok-"));
    try {
      const res = generateSiteFromJob(createTestProductionJob(), dir, { clean: true });
      assert.equal(res.ok, true);
      if (res.ok) {
        assert.ok(existsSync(join(dir, "index.html")));
        const html = readFileSync(join(dir, "index.html"), "utf8");
        assert.ok(html.includes("viewport"));
        assert.ok(html.includes('name="robots" content="noindex'));
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
