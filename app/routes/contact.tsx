import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { BRAND_EMAIL, BRAND_NAME, brandTitle } from "~/lib/brand";
import { loadConfiguratorState, formatConfigSummary } from "~/lib/configurator/storage";

export const meta = () => [{ title: brandTitle("Contact") }];

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [searchParams] = useSearchParams();
  const fromConfigurator = searchParams.get("from") === "configurateur";
  const [summary, setSummary] = useState("");

  useEffect(() => {
    try {
      const fromSession = sessionStorage.getItem("sa-contact-config-summary");
      if (fromSession) {
        setSummary(fromSession);
        return;
      }
    } catch {
      /* ignore */
    }
    if (fromConfigurator) {
      setSummary(formatConfigSummary(loadConfiguratorState()));
    }
  }, [fromConfigurator]);

  return (
    <section className="section">
      <div className="container contact-layout">
        <div>
          <p className="eyebrow">Contact</p>
          <h1>Parlons de votre projet.</h1>
          <p className="lead">
            Racontez-moi votre métier et ce dont vous avez besoin — même en deux lignes. Réponse
            sous 24 à 48 h, sans engagement.
          </p>
          {summary && (
            <aside className="contact-config-summary" aria-label="Récapitulatif configurateur">
              <h2>Votre configuration en cours</h2>
              <pre>{summary}</pre>
              <p>
                <Link to="/configurateur">Modifier ma configuration</Link>
              </p>
            </aside>
          )}
          <ul className="text-muted" style={{ paddingLeft: "1.1em" }}>
            <li>{BRAND_EMAIL}</li>
            <li>Basée dans l’Oise — aussi à distance partout en France</li>
          </ul>
        </div>
        <div className="contact-panel">
          {sent ? (
            <p role="status">
              Votre messagerie devrait s’ouvrir. Sinon, écrivez à {BRAND_EMAIL}.
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                const name = String(data.get("name") ?? "");
                const email = String(data.get("email") ?? "");
                const message = String(data.get("message") ?? "");
                const fullMessage = summary
                  ? `${message}\n\n---\n${summary}`
                  : message;
                const subject = encodeURIComponent(`Contact ${BRAND_NAME} — ${name}`);
                const body = encodeURIComponent(`${fullMessage}\n\n— ${name}\n${email}`);
                window.location.href = `mailto:${BRAND_EMAIL}?subject=${subject}&body=${body}`;
                setSent(true);
              }}
            >
              <div className="form-field">
                <label htmlFor="name">Nom</label>
                <input id="name" name="name" required autoComplete="name" />
              </div>
              <div className="form-field">
                <label htmlFor="email">E-mail</label>
                <input id="email" name="email" type="email" required autoComplete="email" />
              </div>
              <div className="form-field">
                <label htmlFor="message">Votre besoin</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  placeholder="Décrivez votre activité et ce que vous attendez d’un site."
                  defaultValue={
                    fromConfigurator
                      ? "Bonjour, j’ai préparé une configuration sur le configurateur et souhaite en discuter."
                      : undefined
                  }
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Envoyer ma demande
              </button>
            </form>
          )}
          <p className="text-muted" style={{ marginTop: "1rem", fontSize: "0.875rem" }}>
            Formulaire de démonstration — ouvre votre messagerie.{" "}
            <Link to="/">Retour à l’accueil</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
