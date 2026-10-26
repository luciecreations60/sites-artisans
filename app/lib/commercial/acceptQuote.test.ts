import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decideAcceptQuoteProjectLink, quoteStatusLabelFr } from "./acceptQuote.ts";

describe("decideAcceptQuoteProjectLink", () => {
  it("refuse sans configuration", () => {
    const d = decideAcceptQuoteProjectLink({
      configurationId: null,
      prospectId: "p1",
      projectIdForProspect: "proj1",
      configurationProjectId: null,
    });
    assert.equal(d.action, "no_configuration");
  });

  it("signale already_linked si config déjà liée", () => {
    const d = decideAcceptQuoteProjectLink({
      configurationId: "cfg1",
      prospectId: "p1",
      projectIdForProspect: "proj1",
      configurationProjectId: "proj1",
    });
    assert.equal(d.action, "already_linked");
    if (d.action === "already_linked") assert.equal(d.projectId, "proj1");
  });

  it("demande conversion si pas de projet prospect", () => {
    const d = decideAcceptQuoteProjectLink({
      configurationId: "cfg1",
      prospectId: "p1",
      projectIdForProspect: null,
      configurationProjectId: null,
    });
    assert.equal(d.action, "needs_conversion");
  });

  it("propose le lien quand projet et config existent", () => {
    const d = decideAcceptQuoteProjectLink({
      configurationId: "cfg1",
      prospectId: "p1",
      projectIdForProspect: "proj1",
      configurationProjectId: null,
    });
    assert.equal(d.action, "link");
    if (d.action === "link") {
      assert.equal(d.projectId, "proj1");
      assert.equal(d.configurationId, "cfg1");
    }
  });
});

describe("quoteStatusLabelFr", () => {
  it("traduit les statuts connus", () => {
    assert.equal(quoteStatusLabelFr("accepted"), "accepté");
    assert.equal(quoteStatusLabelFr("refused"), "refusé");
    assert.equal(quoteStatusLabelFr("weird"), "weird");
  });
});
