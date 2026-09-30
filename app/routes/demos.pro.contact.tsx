import { useOutletContext } from "react-router";
import type { TradeData } from "~/data/types";
import { artisanName, companyName } from "~/lib/personalize";
import { formatPhone } from "~/lib/format";

export default function DemoProContact() {
  const { trade } = useOutletContext<{ trade: TradeData }>();

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: "40rem" }}>
        <h1>Prendre rendez-vous</h1>
        <p className="text-muted">
          Formulaire type « RDV » pour la formule Pro — démonstration sans envoi serveur.
        </p>
        <p>
          <strong>{companyName(trade)}</strong>
          <br />
          {artisanName(trade)} · {trade.defaultCity}
          <br />
          <a href={`tel:${trade.defaultPhone.replace(/\s/g, "")}`}>
            {formatPhone(trade.defaultPhone)}
          </a>
        </p>
        <form
          className="card"
          onSubmit={(e) => {
            e.preventDefault();
            alert("Démonstration — rendez-vous non enregistré.");
          }}
        >
          <div className="form-field">
            <label htmlFor="motif">Motif</label>
            <select id="motif" name="motif" required defaultValue="">
              <option value="" disabled>
                Choisir…
              </option>
              <option value="visite">Visite sur place</option>
              <option value="visio">Appel / visio</option>
              <option value="urgence">Urgence</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="date">Date souhaitée</label>
            <input id="date" name="date" type="date" required />
          </div>
          <div className="form-field">
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" name="notes" />
          </div>
          <button type="submit" className="btn btn-primary">
            Confirmer (démo)
          </button>
        </form>
      </div>
    </main>
  );
}
