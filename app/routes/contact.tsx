import { useState } from "react";
import { Link } from "react-router";

export const meta = () => [{ title: "Contact — Sites Artisans" }];

export default function Contact() {
  const [sent, setSent] = useState(false);

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
          <ul className="text-muted" style={{ paddingLeft: "1.1em" }}>
            <li>contact@sites-artisans.fr</li>
            <li>Basée dans l’Oise — aussi à distance partout en France</li>
          </ul>
        </div>
        <div className="contact-panel">
          {sent ? (
            <p role="status">
              Votre messagerie devrait s’ouvrir. Sinon, écrivez à contact@sites-artisans.fr.
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                const name = String(data.get("name") ?? "");
                const email = String(data.get("email") ?? "");
                const message = String(data.get("message") ?? "");
                const subject = encodeURIComponent(`Contact Sites Artisans — ${name}`);
                const body = encodeURIComponent(`${message}\n\n— ${name}\n${email}`);
                window.location.href = `mailto:contact@sites-artisans.fr?subject=${subject}&body=${body}`;
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
