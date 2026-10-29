import { Link } from "react-router";
import { TradeExamplesGrid } from "~/components/TradeExamplesGrid";
import { UX_LABELS } from "~/lib/configurator/bridge";

export const meta = () => [{ title: "Exemples — Site AZ" }];

export default function Demos() {
  return (
    <>
      <section className="section section--tight">
        <div className="container">
          <p className="eyebrow">{UX_LABELS.gallery}</p>
          <h1>Voyez ce que ça donne pour votre métier.</h1>
          <p className="lead">
            Choisissez votre activité, ouvrez un exemple. Ensuite vous pourrez le personnaliser.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <TradeExamplesGrid />

          <div className="hero-actions" style={{ marginTop: "2.5rem", justifyContent: "center" }}>
            <Link to="/configurateur" className="btn btn-primary">
              C’est mon métier — {UX_LABELS.personalizeMine}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
