import { useState, type FormEvent } from "react";
import { useOutletContext } from "react-router";
import { Estimator } from "~/components/Estimator";
import { DemoModulesNote } from "~/components/DemoModulesNote";
import type { TradeData } from "~/data/types";
import { useDemoModules } from "~/lib/templates/useDemoModules";

export default function DemoProDevis() {
  const { trade } = useOutletContext<{ trade: TradeData }>();
  const modules = useDemoModules("pro");
  const [status, setStatus] = useState<string | null>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(
      "Démonstration uniquement — aucun message n’a été envoyé. Sur un site client, ce formulaire sera relié à votre boîte mail ou à votre CRM.",
    );
  };

  return (
    <main className="section">
      <DemoModulesNote modules={modules} />
      <div className="container grid grid-2">
        <div>
          <h1>Devis & estimation</h1>
          <p className="text-muted">
            Estimateur des prestations de l’artisan (barème de démo fictif) — distinct du tarif de
            création du site Site AZ.
          </p>
          {modules.estimator ? (
            <Estimator trade={trade} demoMode devisPath="/pro/contact" />
          ) : (
            <p className="text-muted" role="status">
              L’estimateur n’est pas activé pour cette configuration. Utilisez le formulaire de
              rappel.
            </p>
          )}
        </div>
        {modules.quote_form || modules.contact_form ? (
          <form className="card" onSubmit={onSubmit} noValidate>
            <h2 style={{ fontSize: "1.15rem" }}>Être rappelé</h2>
            <div className="form-field">
              <label htmlFor="tel">Téléphone</label>
              <input id="tel" name="tel" type="tel" required autoComplete="tel" />
            </div>
            <div className="form-field">
              <label htmlFor="creneau">Créneau souhaité</label>
              <select id="creneau" name="creneau" defaultValue="matin">
                <option value="matin">Matin</option>
                <option value="aprem">Après-midi</option>
                <option value="soir">Fin de journée</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              Demander un rappel
            </button>
            {status ? (
              <p className="demo-form-status" role="status">
                {status}
              </p>
            ) : null}
          </form>
        ) : null}
      </div>
    </main>
  );
}
