import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertIssuedQuoteContract } from "./issuedQuoteContract.ts";

const validIssued = {
  kind: "issued",
  locked: true,
  reference: "D-20261012-000001",
  issuedAt: "2026-10-12T00:00:00.000Z",
  pricingComplete: true,
  taxRegime: "franchise",
  vatRateBps: null,
  issuerSnapshot: {
    legal_name: "Site AZ",
    address_line: "1 rue Test",
    city: "Lyon",
  },
};

describe("assertIssuedQuoteContract", () => {
  it("accepte un devis émis valide", () => {
    assert.equal(assertIssuedQuoteContract(validIssued).ok, true);
  });

  it("refuse un insert issued sans verrouillage", () => {
    const res = assertIssuedQuoteContract({ ...validIssued, locked: false });
    assert.equal(res.ok, false);
  });

  it("refuse sans référence ou sans date d’émission", () => {
    assert.equal(assertIssuedQuoteContract({ ...validIssued, reference: null }).ok, false);
    assert.equal(assertIssuedQuoteContract({ ...validIssued, issuedAt: null }).ok, false);
  });

  it("refuse sans informations légales", () => {
    assert.equal(
      assertIssuedQuoteContract({ ...validIssued, issuerSnapshot: { legal_name: "X" } }).ok,
      false,
    );
  });

  it("laisse passer simulation/draft", () => {
    assert.equal(
      assertIssuedQuoteContract({
        kind: "simulation",
        locked: false,
        reference: null,
        issuedAt: null,
        pricingComplete: false,
        taxRegime: "unknown",
        vatRateBps: null,
        issuerSnapshot: null,
      }).ok,
      true,
    );
  });
});
