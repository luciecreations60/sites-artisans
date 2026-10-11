import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluateQuoteLockMutation,
  issuedImpliesLocked,
  quoteStatusTransitionAllowed,
} from "./quoteStatus.ts";

describe("quoteStatusTransitionAllowed", () => {
  it("autorise open → sent et sent → accepted", () => {
    assert.equal(quoteStatusTransitionAllowed("open", "sent"), true);
    assert.equal(quoteStatusTransitionAllowed("sent", "accepted"), true);
  });

  it("refuse accepted → open et refused → accepted", () => {
    assert.equal(quoteStatusTransitionAllowed("accepted", "open"), false);
    assert.equal(quoteStatusTransitionAllowed("refused", "accepted"), false);
  });

  it("autorise sent → refused | cancelled | superseded", () => {
    assert.equal(quoteStatusTransitionAllowed("sent", "refused"), true);
    assert.equal(quoteStatusTransitionAllowed("sent", "cancelled"), true);
    assert.equal(quoteStatusTransitionAllowed("sent", "superseded"), true);
  });
});

describe("evaluateQuoteLockMutation", () => {
  it("bloque le déverrouillage d’un devis émis", () => {
    const res = evaluateQuoteLockMutation(
      { locked: true, kind: "issued", status: "sent" },
      { locked: false, kind: "issued", status: "sent", unlock: true },
    );
    assert.equal(res.ok, false);
  });

  it("autorise un changement de statut commercial sur devis verrouillé", () => {
    const res = evaluateQuoteLockMutation(
      { locked: true, kind: "issued", status: "sent" },
      { locked: true, kind: "issued", status: "accepted" },
    );
    assert.equal(res.ok, true);
  });

  it("refuse la modification contractuelle sur devis verrouillé", () => {
    const res = evaluateQuoteLockMutation(
      { locked: true, kind: "issued", status: "sent" },
      {
        locked: true,
        kind: "issued",
        status: "sent",
        contractualChanged: true,
      },
    );
    assert.equal(res.ok, false);
  });

  it("autorise la dissociation prospect (RGPD) sans toucher au snapshot", () => {
    const res = evaluateQuoteLockMutation(
      { locked: true, kind: "issued", status: "sent" },
      {
        locked: true,
        kind: "issued",
        status: "sent",
        unlinkProspect: true,
      },
    );
    assert.equal(res.ok, true);
  });

  it("refuse la réaffectation de prospect", () => {
    const res = evaluateQuoteLockMutation(
      { locked: true, kind: "issued", status: "sent" },
      {
        locked: true,
        kind: "issued",
        status: "sent",
        reassignProspect: true,
      },
    );
    assert.equal(res.ok, false);
  });

  it("refuse une transition de statut illégale même verrouillé", () => {
    const res = evaluateQuoteLockMutation(
      { locked: true, kind: "issued", status: "accepted" },
      { locked: true, kind: "issued", status: "open" },
    );
    assert.equal(res.ok, false);
  });
});

describe("issuedImpliesLocked", () => {
  it("exige locked pour kind=issued", () => {
    assert.equal(issuedImpliesLocked("issued", true), true);
    assert.equal(issuedImpliesLocked("issued", false), false);
    assert.equal(issuedImpliesLocked("draft", false), true);
  });
});
