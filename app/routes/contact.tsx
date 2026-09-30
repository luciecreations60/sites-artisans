import { useState } from "react";

export const meta = () => [{ title: "Contact — Sites Artisans" }];

export default function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <section className="section">
      <div className="container">
        <h1>Contact</h1>
        <p className="text-muted">
          Formulaire de démonstration — aucune donnée n’est envoyée à un serveur pour le moment.
          Utilisez le bouton pour ouvrir votre messagerie.
        </p>
        {sent ? (
          <p role="status">Votre messagerie devrait s’ouvrir. Sinon, écrivez à l’adresse indiquée dans le message.</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const name = String(data.get("name") ?? "");
              const email = String(data.get("email") ?? "");
              const message = String(data.get("message") ?? "");
              const subject = encodeURIComponent(`Contact Sites Artisans — ${name}`);
              const body = encodeURIComponent(
                `${message}\n\n— ${name}\n${email}`,
              );
              window.location.href = `mailto:contact@sites-artisans.fr?subject=${subject}&body=${body}`;
              setSent(true);
            }}
            style={{ maxWidth: "32rem", marginTop: "1.5rem" }}
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
              <label htmlFor="message">Message</label>
              <textarea id="message" name="message" required />
            </div>
            <button type="submit" className="btn btn-primary">
              Envoyer par e-mail
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
