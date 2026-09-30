import { useState } from "react";
import { useOutletContext } from "react-router";
import type { TradeData } from "~/data/types";

const steps = ["Votre besoin", "Détails", "Coordonnées"];

export default function DemoAvanceDevis() {
  const { trade } = useOutletContext<{ trade: TradeData }>();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <main className="section">
        <div className="container">
          <h1>Demande enregistrée (démo)</h1>
          <p className="text-muted">
            Aucune donnée n’a été transmise. Sur votre site, ce formulaire enverrait un e-mail ou
            une notification.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: "36rem" }}>
        <h1>Demande de devis</h1>
        <p className="text-muted">
          Étape {step + 1} sur {steps.length} — {steps[step]}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (step < steps.length - 1) setStep((s) => s + 1);
            else setDone(true);
          }}
        >
          {step === 0 && (
            <div className="form-field">
              <label htmlFor="need">Que souhaitez-vous ?</label>
              <select id="need" name="need" required defaultValue="">
                <option value="" disabled>
                  Choisir…
                </option>
                {trade.services.map((s) => (
                  <option key={s.title} value={s.title}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          {step === 1 && (
            <>
              <div className="form-field">
                <label htmlFor="detail">Précisions (surface, délai…)</label>
                <textarea id="detail" name="detail" required />
              </div>
              <div className="form-field">
                <label htmlFor="city">Commune</label>
                <input id="city" name="city" defaultValue={trade.defaultCity} required />
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <div className="form-field">
                <label htmlFor="name">Nom</label>
                <input id="name" name="name" required />
              </div>
              <div className="form-field">
                <label htmlFor="phone">Téléphone</label>
                <input id="phone" name="phone" type="tel" required />
              </div>
              <div className="form-field">
                <label htmlFor="email">E-mail</label>
                <input id="email" name="email" type="email" required />
              </div>
            </>
          )}
          <div className="hero-actions">
            {step > 0 && (
              <button type="button" className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>
                Retour
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              {step < steps.length - 1 ? "Continuer" : "Envoyer (démo)"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
