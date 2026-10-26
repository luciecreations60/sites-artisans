import { Link } from "react-router";
import { LegalDocument } from "~/components/LegalDocument";
import { brandTitle } from "~/lib/brand";
import {
  LEGAL_IDENTITY,
  legalAddressLabel,
  legalSiretLabel,
  taxRegimeLabel,
} from "~/lib/legal";

export const meta = () => [{ title: brandTitle("Mentions légales") }];

export default function MentionsLegales() {
  const id = LEGAL_IDENTITY;

  return (
    <LegalDocument
      title="Mentions légales"
      intro={
        <>
          Informations relatives à l’éditeur du site {id.tradeName} et à son hébergement, conformément
          à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique (LCEN).
        </>
      }
      sections={[
        {
          id: "editeur",
          title: "1. Éditeur du site",
          content: (
            <>
              <p>
                Le site {id.tradeName} est édité par <strong>{id.legalName}</strong>, activité de
                création de sites internet pour artisans et petites entreprises.
              </p>
              <ul>
                <li>Enseigne : {id.tradeName}</li>
                <li>Responsable de la publication : {id.publisherName}</li>
                <li>Adresse : {legalAddressLabel(id)}</li>
                <li>SIRET : {legalSiretLabel(id)}</li>
                <li>E-mail : <a href={`mailto:${id.email}`}>{id.email}</a></li>
                <li>{taxRegimeLabel(id)}</li>
              </ul>
            </>
          ),
        },
        {
          id: "hebergeur",
          title: "2. Hébergement",
          content: (
            <>
              <p>
                <strong>{id.host.name}</strong>
              </p>
              <p>{id.host.details}</p>
              <p>{id.host.address}</p>
              <p>
                Les sites livrés aux clients sont publiés sur l’hébergement qu’ils souscrivent
                eux-mêmes (par exemple OVH ou un autre fournisseur), distinct de celui du site Site
                AZ.
              </p>
            </>
          ),
        },
        {
          id: "contact",
          title: "3. Contact",
          content: (
            <>
              <p>
                Pour toute question relative au site ou à une prestation :{" "}
                <a href={`mailto:${id.email}`}>{id.email}</a> ou via la page{" "}
                <Link to="/contact">Contact</Link>.
              </p>
            </>
          ),
        },
        {
          id: "propriete",
          title: "4. Propriété intellectuelle",
          content: (
            <>
              <p>
                Les textes, graphismes, logos et éléments de présentation du site {id.tradeName}{" "}
                sont protégés. Toute reproduction non autorisée est interdite.
              </p>
              <p>
                Les contenus des démonstrations métiers sont illustratifs. Les contenus livrés à un
                client dans le cadre d’une prestation lui sont cédés selon les conditions prévues au
                devis et aux{" "}
                <Link to="/cgv">conditions générales de vente</Link>.
              </p>
            </>
          ),
        },
        {
          id: "responsabilite",
          title: "5. Responsabilité",
          content: (
            <>
              <p>
                Site AZ s’efforce d’assurer l’exactitude des informations publiées. Des
                inexactitudes ou omissions peuvent toutefois subsister. L’éditeur ne saurait être
                tenu responsable des dommages directs ou indirects liés à l’utilisation du site
                public, hors obligations contractuelles liées à une prestation acceptée.
              </p>
            </>
          ),
        },
        {
          id: "donnees",
          title: "6. Données personnelles",
          content: (
            <>
              <p>
                Le traitement des données personnelles est décrit dans la{" "}
                <Link to="/confidentialite">politique de confidentialité</Link>.
              </p>
            </>
          ),
        },
        {
          id: "droit",
          title: "7. Droit applicable",
          content: (
            <>
              <p>
                Les présentes mentions sont régies par le droit français. En cas de litige et à
                défaut d’accord amiable, les tribunaux français seront compétents.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
