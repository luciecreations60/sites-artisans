import { ConfiguratorApp } from "~/components/configurator/ConfiguratorApp";

export const meta = () => [
  { title: "Personnaliser mon site — Site AZ" },
  {
    name: "description",
    content:
      "Choisissez votre métier et votre formule, ajustez nom, ville et style : l’aperçu et le tarif évoluent immédiatement.",
  },
];

export default function ConfigurateurRoute() {
  return (
    <section className="section section--tight cfg-page">
      <div className="container">
        <ConfiguratorApp />
      </div>
    </section>
  );
}
