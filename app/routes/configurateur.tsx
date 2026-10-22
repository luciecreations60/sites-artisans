import { ConfiguratorApp } from "~/components/configurator/ConfiguratorApp";

export const meta = () => [
  { title: "Configurateur — Site AZ" },
  {
    name: "description",
    content:
      "Choisissez votre métier, personnalisez votre site et découvrez immédiatement votre tarif.",
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
