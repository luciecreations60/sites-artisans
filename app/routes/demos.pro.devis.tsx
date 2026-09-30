import { useOutletContext } from "react-router";
import { Estimator } from "~/components/Estimator";
import type { TradeData } from "~/data/types";

export default function DemoProDevis() {
  const { trade } = useOutletContext<{ trade: TradeData }>();

  return (
    <main className="section">
      <div className="container grid grid-2">
        <div>
          <h1>Devis & estimation</h1>
          <p className="text-muted">
            Combinez l’estimateur indicatif et une demande de rappel — contenu de démonstration.
          </p>
          <Estimator trade={trade} />
        </div>
        <form
          className="card"
          onSubmit={(e) => {
            e.preventDefault();
            alert("Démonstration — demande non envoyée.");
          }}
        >
          <h2 style={{ fontSize: "1.15rem" }}>Être rappelé</h2>
          <div className="form-field">
            <label htmlFor="tel">Téléphone</label>
            <input id="tel" name="tel" type="tel" required />
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
        </form>
      </div>
    </main>
  );
}
