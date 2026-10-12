import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertProductionJobQuote,
  isAcceptedLockedIssuedQuote,
} from "./quoteGuard.ts";

describe("garde-fou devis → production", () => {
  const liveQuote = {
    id: "q1",
    kind: "issued",
    status: "accepted",
    locked: true,
    project_id: "p1",
    configuration_id: "c1",
  };

  it("accepte issued + accepted + locked cohérents", () => {
    assert.equal(isAcceptedLockedIssuedQuote(liveQuote), true);
    const res = assertProductionJobQuote({
      isTestFixture: false,
      projectId: "p1",
      configurationId: "c1",
      acceptedQuoteId: "q1",
      configurationProjectId: "p1",
      quote: liveQuote,
    });
    assert.equal(res.ok, true);
  });

  it("refuse status sent / refused / simulation", () => {
    for (const status of ["sent", "refused", "cancelled", "open"]) {
      const res = assertProductionJobQuote({
        isTestFixture: false,
        projectId: "p1",
        configurationId: "c1",
        acceptedQuoteId: "q1",
        quote: { ...liveQuote, status },
      });
      assert.equal(res.ok, false, status);
    }
    assert.equal(
      assertProductionJobQuote({
        isTestFixture: false,
        projectId: "p1",
        configurationId: "c1",
        acceptedQuoteId: "q1",
        quote: { ...liveQuote, kind: "simulation", status: "accepted" },
      }).ok,
      false,
    );
  });

  it("refuse un devis d’un autre projet", () => {
    const res = assertProductionJobQuote({
      isTestFixture: false,
      projectId: "p1",
      configurationId: "c1",
      acceptedQuoteId: "q1",
      quote: { ...liveQuote, project_id: "p-other" },
    });
    assert.equal(res.ok, false);
    if (!res.ok) assert.match(res.reason, /autre projet/i);
  });

  it("autorise les fixtures TEST sans devis", () => {
    const res = assertProductionJobQuote({
      isTestFixture: true,
      projectId: null,
      configurationId: null,
      acceptedQuoteId: null,
      quote: null,
    });
    assert.equal(res.ok, true);
  });

  it("refuse une fixture TEST avec ids CRM", () => {
    const res = assertProductionJobQuote({
      isTestFixture: true,
      projectId: "p1",
      configurationId: null,
      acceptedQuoteId: null,
    });
    assert.equal(res.ok, false);
  });
});
