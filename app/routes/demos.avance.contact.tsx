import { useOutletContext } from "react-router";
import type { TradeData } from "~/data/types";
import { formatPhone } from "~/lib/format";
import { artisanName } from "~/lib/personalize";

export default function DemoAvanceContact() {
  const { trade } = useOutletContext<{ trade: TradeData }>();

  return (
    <main className="section">
      <div className="container grid grid-2">
        <div>
          <h1>Contact</h1>
          <p>
            <strong>{artisanName(trade)}</strong>
            <br />
            {trade.defaultCity}
          </p>
          <p>
            <a href={`tel:${trade.defaultPhone.replace(/\s/g, "")}`}>
              {formatPhone(trade.defaultPhone)}
            </a>
            <br />
            <a href={`mailto:${trade.defaultEmail}`}>{trade.defaultEmail}</a>
          </p>
        </div>
        <form
          className="card"
          onSubmit={(e) => {
            e.preventDefault();
            alert("Démonstration — formulaire non connecté.");
          }}
        >
          <div className="form-field">
            <label htmlFor="msg">Message</label>
            <textarea id="msg" name="msg" required />
          </div>
          <button type="submit" className="btn btn-primary">
            Envoyer
          </button>
        </form>
      </div>
    </main>
  );
}
