/**
 * Parité démo ↔ générateur : structure, shells, modules (33 combinaisons).
 * Ne valide pas le pixel-perfect navigateur (campagne visuelle séparée).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createTestProductionJob } from "./fixtures.ts";
import { generateSiteInMemory } from "./generate.ts";
import { escapeHtml, expectedSectionsForPlan } from "./renderSite.ts";
import { resolveBuildModules } from "./buildConfig.ts";
import type { OfferTier, TradeSlug } from "../../data/types.ts";

const TRADES: TradeSlug[] = [
  "plombier",
  "electricien",
  "couvreur",
  "peintre",
  "paysagiste",
  "garage",
  "boulanger",
  "coiffure",
  "bienetre",
  "cordonnier",
  "serrurier",
];

const TIERS: OfferTier[] = ["essentiel", "avance", "pro"];

const SHELL: Record<OfferTier, string> = {
  essentiel: "e-shell",
  avance: "sg-shell",
  pro: "r-shell",
};

describe("parité générateur / formules", () => {
  it("différencie réellement Essentiel, Avancé et Pro", () => {
    const results = TIERS.map((planId) => {
      const job = createTestProductionJob({ planId, tradeSlug: "plombier" });
      job.config.planId = planId;
      job.companyName = "Atelier Parité";
      job.config.companyName = "Atelier Parité";
      return { planId, ...generateSiteInMemory(job) };
    });

    for (const r of results) {
      assert.equal(r.ok, true, r.planId);
      assert.ok(r.files["index.html"].includes(`class="${SHELL[r.planId]}"`));
      assert.ok(r.files["styles.css"].includes(`.${SHELL[r.planId]}`));
    }

    assert.ok(!results[0].files["services.html"]);
    assert.ok(results[1].files["services.html"]);
    assert.ok(results[2].files["services.html"]);
    assert.ok(results[2].config.modules.includes("estimator"));
    assert.ok(!results[0].config.modules.includes("estimator"));
  });

  it("conserve identité / thème / modules pour 3 métiers représentatifs", () => {
    const samples: { trade: TradeSlug; plan: OfferTier }[] = [
      { trade: "plombier", plan: "essentiel" },
      { trade: "coiffure", plan: "avance" },
      { trade: "boulanger", plan: "pro" },
    ];
    for (const s of samples) {
      const job = createTestProductionJob({
        tradeSlug: s.trade,
        planId: s.plan,
        companyName: `Maison ${s.trade}`,
      });
      job.config.tradeSlug = s.trade;
      job.config.planId = s.plan;
      job.config.companyName = `Maison ${s.trade}`;
      job.config.themeId = "ocean";
      job.config.city = "Compiègne";
      const res = generateSiteInMemory(job);
      assert.equal(res.ok, true);
      assert.ok(res.files["index.html"].includes(`Maison ${s.trade}`));
      assert.ok(res.files["index.html"].includes("Compiègne"));
      assert.ok(res.files["styles.css"].includes("#3d7ea6") || res.files["styles.css"].includes("ocean") || res.files["styles.css"].includes("--accent"));
      assert.equal(res.config.tradeSlug, s.trade);
      assert.equal(res.config.planId, s.plan);
      for (const section of expectedSectionsForPlan(s.plan)) {
        if (section === "footer") {
          assert.ok(res.files["index.html"].includes('data-section="footer"') || res.files["index.html"].includes("site-footer"));
        } else if (section === "contact" && s.plan === "essentiel") {
          assert.ok(res.files["index.html"].includes('data-section="contact"'));
        } else if (section !== "contact") {
          assert.ok(
            res.files["index.html"].includes(`data-section="${section}"`) ||
              Object.values(res.files).some((f) => f.includes(`data-section="${section}"`)),
            `${s.trade}/${s.plan} section ${section}`,
          );
        }
      }
    }
  });

  it("couvre les 33 combinaisons métier × formule (modules + shell)", () => {
    let count = 0;
    for (const trade of TRADES) {
      for (const plan of TIERS) {
        const { modules } = resolveBuildModules(plan, []);
        const job = createTestProductionJob({ tradeSlug: trade, planId: plan });
        job.config.tradeSlug = trade;
        job.config.planId = plan;
        job.config.desiredFeatureIds = modules;
        const res = generateSiteInMemory(job);
        assert.equal(res.ok, true, `${trade}/${plan}`);
        assert.ok(res.files["index.html"].includes(`class="${SHELL[plan]}"`));
        assert.ok(res.files["site.json"].includes(`"planId": "${plan}"`));
        assert.ok(res.files["site.json"].includes(`"tradeSlug": "${trade}"`));
        if (plan === "essentiel") {
          assert.ok(!res.files["services.html"]);
        } else {
          assert.ok(res.files["contact.html"]);
        }
        count += 1;
      }
    }
    assert.equal(count, 33);
  });
});

describe("sécurité HTML généré", () => {
  it("échappe les contenus client (pas d’injection script)", () => {
    const evil = `<script>alert(1)</script>`;
    assert.equal(escapeHtml(evil), "&lt;script&gt;alert(1)&lt;/script&gt;");
    const job = createTestProductionJob();
    job.companyName = evil;
    job.config.companyName = evil;
    job.content.aboutText = `<img src=x onerror=alert(1)>`;
    const res = generateSiteInMemory(job);
    assert.equal(res.ok, true);
    assert.ok(!res.files["index.html"].includes("<script>alert"));
    assert.ok(res.files["index.html"].includes("&lt;script&gt;"));
    assert.ok(!res.files["index.html"].includes("<img src=x"));
    assert.ok(res.files["index.html"].includes("&lt;img src=x"));
  });
});
