import { Link } from "react-router";
import {
  commercialNotes,
  comparisonFeatures,
  formatSetupPrice,
  offerPlans,
} from "~/data/offers";

export const meta = () => [{ title: "Comparatif — Site AZ" }];

function cell(value: boolean | string) {
  if (value === true) return "Oui";
  if (value === false) return "Non";
  return value;
}

export default function Comparatif() {
  return (
    <section className="section">
      <div className="container">
        <h1>Comparatif des formules</h1>
        <p className="lead section-lead">
          Vue d’ensemble pour choisir la formule adaptée à votre activité — sans liste
          interminable.
        </p>

        <div className="compare-prices" aria-label="Prix de création de référence">
          {offerPlans.map((plan) => (
            <div key={plan.tier} className="compare-prices__item">
              <span className="compare-prices__name">{plan.name}</span>
              <span className="compare-prices__amount">
                {formatSetupPrice(plan.setupPrice)}
              </span>
              <span className="compare-prices__hint">création</span>
            </div>
          ))}
        </div>

        <div className="compare-scroll">
          <table className="compare-table">
            <thead>
              <tr>
                <th scope="col">Fonctionnalité</th>
                <th scope="col">Essentiel</th>
                <th scope="col">Avancé</th>
                <th scope="col">Pro</th>
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td>{cell(row.essentiel)}</td>
                  <td>{cell(row.avance)}</td>
                  <td>{cell(row.pro)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="commercial-footnote text-muted">
          {commercialNotes.hosting} {commercialNotes.maintenance}
        </p>
        <p style={{ marginTop: "1.25rem" }}>
          <Link to="/offres">Voir le détail des offres →</Link>
        </p>
      </div>
    </section>
  );
}
