import { comparisonFeatures } from "~/data/offers";

export const meta = () => [{ title: "Comparatif — Sites Artisans" }];

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
        <p className="lead">
          Vue d’ensemble pour choisir la formule adaptée à votre activité — sans liste interminable.
        </p>
        <div style={{ overflowX: "auto", marginTop: "1.5rem" }}>
          <table className="compare-table">
            <thead>
              <tr>
                <th>Fonctionnalité</th>
                <th>Essentiel</th>
                <th>Avancé</th>
                <th>Pro</th>
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{cell(row.essentiel)}</td>
                  <td>{cell(row.avance)}</td>
                  <td>{cell(row.pro)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
