import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router";
import {
  calculateQuote,
  centsToEuroLabel,
} from "~/lib/catalog/pricing";
import type { PublicCatalog } from "~/data/catalog/types";
import { buildCommercialPayload, ensureClientLocalId } from "~/lib/commercial/buildPayload";
import { submitCommercialRequest } from "~/lib/commercial/submitApi";
import type { CommercialSubmitResult } from "~/lib/commercial/types";
import {
  loadConfiguratorState,
  saveConfiguratorState,
} from "~/lib/configurator/storage";
import type { ConfiguratorState } from "~/lib/configurator/types";

type Props = {
  catalog: PublicCatalog;
  catalogStatus: "ready" | "migration_pending" | "error";
  initialState?: ConfiguratorState;
};

export function CommercialRequestForm({ catalog, catalogStatus, initialState }: Props) {
  const [state] = useState(() => {
    const s = initialState ?? loadConfiguratorState();
    const withId = { ...s, clientLocalId: ensureClientLocalId(s) };
    saveConfiguratorState(withId);
    return withId;
  });

  const [name, setName] = useState(
    () =>
      [state.profile.firstName, state.profile.lastName].filter(Boolean).join(" ") ||
      state.profile.company ||
      "",
  );
  const [email, setEmail] = useState(() => state.profile.email || "");
  const [phone, setPhone] = useState(() => state.profile.phone || "");
  const [message, setMessage] = useState("");
  const [preference, setPreference] = useState<"email" | "phone" | "either">("either");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Extract<CommercialSubmitResult, { ok: true }> | null>(
    null,
  );

  const claimedCents = useMemo(() => {
    if (!state.planId) return null;
    const included = new Set(
      catalog.planFeatures
        .filter((l) => l.planId === state.planId && l.inclusion === "included")
        .map((l) => l.featureId),
    );
    const extras = state.desiredFeatureIds.filter((id) => !included.has(id));
    try {
      return calculateQuote(catalog, {
        planId: state.planId,
        optionFeatureIds: extras,
        optionQuantities: state.featureQuantities,
      }).creationSubtotalCents;
    } catch {
      return null;
    }
  }, [catalog, state]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (submitting) return;

    const payload = buildCommercialPayload({
      state,
      contactName: name,
      contactEmail: email,
      contactPhone: phone,
      message,
      contactPreference: preference,
      clientClaimedCreationCents: claimedCents,
    });
    if ("error" in payload) {
      setError(payload.error);
      return;
    }
    if (!payload.contact_name || payload.contact_name.length < 2) {
      setError("Indiquez votre nom.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.contact_email)) {
      setError("Indiquez un e-mail valide.");
      return;
    }

    setSubmitting(true);
    const res = await submitCommercialRequest(payload);
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error);
      // Conserve la saisie + config locale (déjà en localStorage)
      return;
    }
    setResult(res);
    try {
      sessionStorage.setItem("sa-commercial-tracking", res.tracking_code);
    } catch {
      /* ignore */
    }
  };

  if (!state.planId || !state.tradeSlug) {
    return (
      <div className="cfg-commercial">
        <h1>Votre projet est presque prêt</h1>
        <p className="text-muted">
          Aucune configuration complète n’a été trouvée. Reprenez le configurateur avant d’envoyer
          une demande.
        </p>
        <Link to="/configurateur" className="btn btn-primary">
          Ouvrir le configurateur
        </Link>
      </div>
    );
  }

  if (result) {
    return (
      <div className="cfg-commercial" role="status">
        <h1>Demande enregistrée</h1>
        <p>
          Merci. Votre configuration a été transmise avec le suivi{" "}
          <strong>{result.tracking_code}</strong>.
        </p>
        <p className="text-muted">
          Montant de création recalculé côté serveur :{" "}
          {centsToEuroLabel(result.server_creation_cents)}
          {result.pricing_complete ? "" : " (chiffrage partiel — étude possible)"}.
        </p>
        {result.price_differs_from_client && (
          <p className="cfg-price__warn">
            Le montant affiché dans votre navigateur différait du recalcul serveur. Seul le montant
            serveur fait foi pour la suite commerciale.
          </p>
        )}
        <p className="text-muted">
          Aucun compte client n’a été créé. Nous vous recontactons pour finaliser. Aucun e-mail
          automatique n’est envoyé tant que l’envoi n’est pas configuré et validé.
        </p>
        <div className="cfg-recap-actions">
          <Link to="/configurateur" className="btn btn-outline">
            Reprendre ma configuration
          </Link>
          <Link
            to={`/demos/${state.tradeSlug}/${state.planId}`}
            className="btn btn-ghost"
          >
            Voir la démonstration
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cfg-commercial">
      <h1>Votre projet est presque prêt</h1>
      <p className="lead">
        Envoyez-nous votre configuration pour que nous puissions échanger sur les derniers détails.
      </p>
      <p className="text-muted">
        Métier, formule, options, couleurs et budget calculé sont déjà connus — pas de ressaisie.
        {catalogStatus !== "ready"
          ? " Attention : le catalogue serveur n’est pas prêt ; l’enregistrement pourra être refusé."
          : ""}
      </p>

      <aside className="cfg-commercial__summary" aria-label="Récapitulatif transmis">
        <p>
          <strong>{state.profile.company || "Entreprise"}</strong> · {state.tradeSlug} · formule{" "}
          {state.planId}
        </p>
        <p>
          Simulation affichée :{" "}
          {claimedCents != null ? centsToEuroLabel(claimedCents) : "—"} (recalculée à l’envoi)
        </p>
      </aside>

      <form className="cfg-commercial__form" onSubmit={onSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="cr-name">Nom</label>
          <input
            id="cr-name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            maxLength={120}
          />
        </div>
        <div className="form-field">
          <label htmlFor="cr-company">Entreprise</label>
          <input
            id="cr-company"
            name="company"
            value={state.profile.company}
            readOnly
            aria-readonly="true"
          />
        </div>
        <div className="form-field">
          <label htmlFor="cr-email">E-mail</label>
          <input
            id="cr-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            maxLength={254}
          />
        </div>
        <div className="form-field">
          <label htmlFor="cr-phone">Téléphone (facultatif)</label>
          <input
            id="cr-phone"
            name="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            maxLength={40}
          />
        </div>
        <div className="form-field">
          <label htmlFor="cr-pref">Préférence de contact</label>
          <select
            id="cr-pref"
            value={preference}
            onChange={(e) => setPreference(e.target.value as typeof preference)}
          >
            <option value="either">Indifférent</option>
            <option value="email">E-mail</option>
            <option value="phone">Téléphone</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="cr-msg">Message (facultatif)</label>
          <textarea
            id="cr-msg"
            name="message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={4000}
          />
        </div>

        <p className="text-muted" style={{ fontSize: "0.875rem" }}>
          En envoyant ce formulaire, vous nous transmettez vos coordonnées et votre configuration
          pour une réponse commerciale. Pas d’inscription newsletter. Voir la{" "}
          <Link to="/confidentialite">politique de confidentialité</Link>.
        </p>

        {error ? (
          <p className="cfg-price__warn" role="alert">
            {error}
          </p>
        ) : null}

        <div className="cfg-recap-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Envoi en cours…" : "Envoyer ma configuration"}
          </button>
          <Link to="/configurateur" className="btn btn-ghost">
            Modifier mes choix
          </Link>
        </div>
      </form>
    </div>
  );
}
