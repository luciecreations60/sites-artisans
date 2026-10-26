import type { ReactNode } from "react";
import { LEGAL_IDENTITY } from "~/lib/legal";

export type LegalSection = {
  id: string;
  title: string;
  content: ReactNode;
};

type Props = {
  title: string;
  intro?: ReactNode;
  sections: LegalSection[];
};

export function LegalDocument({ title, intro, sections }: Props) {
  const { identityComplete, lastUpdated, publicLaunchDate } = LEGAL_IDENTITY;

  return (
    <section className="section section--tight">
      <div className="container legal-doc">
        <header className="legal-doc__header">
          <h1>{title}</h1>
          <p className="text-muted legal-doc__meta">Dernière mise à jour : {lastUpdated}</p>
          {!identityComplete ? (
            <p className="legal-doc__banner" role="status">
              Identité en cours de finalisation (immatriculation prévue pour l’ouverture publique
              du {publicLaunchDate}). Les mentions SIRET et adresse postale seront complétées
              dès que disponibles — aucun numéro fictif n’est publié.
            </p>
          ) : null}
          {intro ? <div className="legal-doc__intro lead">{intro}</div> : null}
        </header>

        <div className="legal-doc__body">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="legal-doc__section">
              <h2>{section.title}</h2>
              <div className="legal-doc__content">{section.content}</div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
