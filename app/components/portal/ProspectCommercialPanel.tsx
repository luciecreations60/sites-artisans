import { useEffect, useState } from "react";
import { Link } from "react-router";
import { centsToEuroLabel } from "~/lib/catalog/pricing";
import {
  anonymizeCommercialRequest,
  issueQuote,
  loadProspectCommercial,
  promoteQuoteToDraft,
  updateQuoteCommercialStatus,
} from "~/lib/commercial/quoteAdmin";
import {
  quoteStatusTransitionAllowed,
  type QuoteCommercialStatus,
} from "~/lib/commercial/quoteStatus";
import type { CommercialRequestRow, QuoteRow, SiteConfigurationRow } from "~/lib/commercial/types";
import { demoPreviewHref } from "~/lib/commercial/buildPayload";
import { formatDateFr } from "~/lib/portal";
import { PortalSection } from "./PortalUi";

type Props = {
  prospectId: string;
};

export function ProspectCommercialPanel({ prospectId }: Props) {
  const [requests, setRequests] = useState<CommercialRequestRow[]>([]);
  const [configs, setConfigs] = useState<SiteConfigurationRow[]>([]);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    const res = await loadProspectCommercial(prospectId);
    setRequests(res.requests);
    setConfigs(res.configurations);
    setQuotes(res.quotes);
    setError(res.error ?? null);
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospectId]);

  if (error?.includes("non appliquée") && requests.length === 0) {
    return (
      <PortalSection title="Configurateur V4">
        <p className="text-muted">{error}</p>
        <p className="text-muted">
          Appliquez la migration <code>20261012_v4_commercial_quotes.sql</code> puis rechargez.
        </p>
      </PortalSection>
    );
  }

  if (requests.length === 0 && configs.length === 0 && quotes.length === 0) {
    return (
      <PortalSection title="Configurateur V4">
        <p className="text-muted">Aucune demande issue du configurateur pour ce prospect.</p>
      </PortalSection>
    );
  }

  return (
    <PortalSection title="Nouvelle demande — Configurateur V4">
      {ok && <p role="status">{ok}</p>}
      {error && !error.includes("non appliquée") && (
        <p className="text-muted" role="alert">
          {error}
        </p>
      )}

      {requests.map((req) => {
        const config = configs.find((c) => c.id === req.configuration_id);
        const relatedQuotes = quotes.filter((q) => q.commercial_request_id === req.id);
        const demoHref =
          config?.trade_slug && config.plan_id
            ? demoPreviewHref(config.trade_slug, config.plan_id)
            : null;

        return (
          <article key={req.id} className="card" style={{ marginBottom: "1rem" }}>
            <h3 style={{ marginTop: 0, fontSize: "1.1rem" }}>
              Suivi {req.tracking_code} · {formatDateFr(req.created_at)}
            </h3>
            <dl className="cfg-recap">
              <div>
                <dt>Contact</dt>
                <dd>
                  {req.contact_name} · {req.contact_email}
                  {req.contact_phone ? ` · ${req.contact_phone}` : ""}
                </dd>
              </div>
              <div>
                <dt>Entreprise</dt>
                <dd>{req.company_name || config?.company_name || "—"}</dd>
              </div>
              <div>
                <dt>Métier / formule</dt>
                <dd>
                  {config?.trade_slug ?? "—"} · {config?.plan_id ?? "—"}
                </dd>
              </div>
              <div>
                <dt>Création (serveur)</dt>
                <dd>
                  {req.server_creation_cents != null
                    ? centsToEuroLabel(req.server_creation_cents)
                    : "—"}
                  {req.server_pricing_complete ? "" : " · partiel"}
                  {req.price_differs_from_client ? " · écart vs navigateur" : ""}
                </dd>
              </div>
              <div>
                <dt>Récurrent</dt>
                <dd>
                  {req.server_recurring_cents != null
                    ? centsToEuroLabel(req.server_recurring_cents)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Personnalisation</dt>
                <dd>
                  thème {config?.theme_id ?? "—"} · police {config?.font_id ?? "—"}
                </dd>
              </div>
              <div>
                <dt>Options</dt>
                <dd>{(config?.desired_feature_ids ?? []).join(", ") || "aucune"}</dd>
              </div>
              {req.message ? (
                <div>
                  <dt>Message</dt>
                  <dd>{req.message}</dd>
                </div>
              ) : null}
            </dl>

            <div className="cfg-recap-actions">
              {demoHref ? (
                <Link to={demoHref} className="btn btn-outline" target="_blank" rel="noreferrer">
                  Aperçu démo (métier + formule)
                </Link>
              ) : null}
            </div>

            <h4 style={{ marginTop: "1.25rem" }}>Devis liés</h4>
            {relatedQuotes.length === 0 ? (
              <p className="text-muted">Aucune ligne devis (simulation absente).</p>
            ) : (
              <ul style={{ paddingLeft: "1.1rem" }}>
                {relatedQuotes.map((q) => (
                  <li key={q.id} style={{ marginBottom: "0.75rem" }}>
                    <strong>
                      {q.kind}
                      {q.reference ? ` ${q.reference}` : ""}
                    </strong>{" "}
                    — {centsToEuroLabel(q.creation_ht_cents)} HT
                    {q.locked ? " · verrouillé" : ""} · {q.status}
                    <div className="cfg-recap-actions" style={{ marginTop: "0.35rem" }}>
                      {q.kind === "simulation" && !q.locked ? (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          disabled={busy}
                          onClick={async () => {
                            setBusy(true);
                            setOk(null);
                            const res = await promoteQuoteToDraft(q.id);
                            setBusy(false);
                            if (!res.ok) setError(res.error);
                            else {
                              setOk("Simulation passée en brouillon.");
                              await reload();
                            }
                          }}
                        >
                          Passer en brouillon
                        </button>
                      ) : null}
                      {(q.kind === "draft" || q.kind === "simulation") && !q.locked ? (
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={busy}
                          onClick={async () => {
                            setBusy(true);
                            setOk(null);
                            setError(null);
                            const res = await issueQuote(q.id);
                            setBusy(false);
                            if (!res.ok) setError(res.error);
                            else {
                              setOk(`Devis émis ${res.reference} (snapshot verrouillé).`);
                              await reload();
                            }
                          }}
                        >
                          Valider et émettre
                        </button>
                      ) : null}
                      {q.kind === "issued" ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => window.print()}
                          >
                            Imprimer le devis
                          </button>
                          {(
                            ["accepted", "refused", "cancelled", "superseded"] as QuoteCommercialStatus[]
                          )
                            .filter((s) => quoteStatusTransitionAllowed(q.status, s))
                            .map((s) => (
                              <button
                                key={s}
                                type="button"
                                className="btn btn-ghost"
                                disabled={busy}
                                onClick={async () => {
                                  setBusy(true);
                                  setError(null);
                                  const res = await updateQuoteCommercialStatus(q.id, s);
                                  setBusy(false);
                                  if (!res.ok) setError(res.error);
                                  else {
                                    setOk(`Statut devis → ${s}`);
                                    await reload();
                                  }
                                }}
                              >
                                Marquer {s}
                              </button>
                            ))}
                        </>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {!req.anonymized_at ? (
              <button
                type="button"
                className="btn btn-ghost"
                disabled={busy}
                style={{ marginTop: "0.75rem" }}
                onClick={async () => {
                  if (
                    !confirm(
                      "Anonymiser cette demande (RGPD) ? Les montants et le suivi sont conservés ; les données personnelles sont effacées.",
                    )
                  ) {
                    return;
                  }
                  setBusy(true);
                  const res = await anonymizeCommercialRequest(req.id);
                  setBusy(false);
                  if (!res.ok) setError(res.error);
                  else {
                    setOk("Demande anonymisée.");
                    await reload();
                  }
                }}
              >
                Anonymiser (RGPD)
              </button>
            ) : (
              <p className="text-muted">Demande anonymisée le {formatDateFr(req.anonymized_at)}</p>
            )}
          </article>
        );
      })}
    </PortalSection>
  );
}
