import { Link } from "react-router";
import { LegalDocument } from "~/components/LegalDocument";
import { commercialNotes, offerPlans, formatSetupPrice } from "~/data/offers";
import { brandTitle } from "~/lib/brand";
import {
  LEGAL_IDENTITY,
  legalAddressLabel,
  legalSiretLabel,
  taxRegimeLabel,
} from "~/lib/legal";

export const meta = () => [{ title: brandTitle("Conditions générales de vente") }];

export default function Cgv() {
  const id = LEGAL_IDENTITY;
  const essentiel = offerPlans.find((p) => p.tier === "essentiel");
  const avance = offerPlans.find((p) => p.tier === "avance");
  const pro = offerPlans.find((p) => p.tier === "pro");

  return (
    <LegalDocument
      title="Conditions générales de vente"
      intro={
        <>
          Les présentes conditions générales de vente (CGV) s’appliquent aux prestations de création
          de sites internet proposées par {id.tradeName} aux professionnels (artisans, indépendants,
          TPE). Elles complètent le devis accepté, qui prévaut en cas de précision particulière.
        </>
      }
      sections={[
        {
          id: "vendeur",
          title: "1. Prestataire",
          content: (
            <>
              <p>
                Prestataire : <strong>{id.legalName}</strong> ({id.tradeName}).
              </p>
              <ul>
                <li>Responsable : {id.publisherName}</li>
                <li>Adresse : {legalAddressLabel(id)}</li>
                <li>SIRET : {legalSiretLabel(id)}</li>
                <li>E-mail : <a href={`mailto:${id.email}`}>{id.email}</a></li>
                <li>{taxRegimeLabel(id)}</li>
              </ul>
            </>
          ),
        },
        {
          id: "objet",
          title: "2. Objet",
          content: (
            <>
              <p>
                Site AZ propose la conception et la livraison de sites vitrines pour artisans et
                petites entreprises, selon des formules de création de référence, personnalisées
                après échange. Le configurateur et les démonstrations en ligne sont indicatifs ; le
                devis détaillé formalise la prestation.
              </p>
            </>
          ),
        },
        {
          id: "formules",
          title: "3. Formules et prix de référence",
          content: (
            <>
              <p>{commercialNotes.setupOnly}</p>
              <ul>
                {essentiel ? (
                  <li>
                    Essentiel — {formatSetupPrice(essentiel.setupPrice)} : {essentiel.tagline}
                  </li>
                ) : null}
                {avance ? (
                  <li>
                    Avancé — {formatSetupPrice(avance.setupPrice)} : {avance.tagline}
                  </li>
                ) : null}
                {pro ? (
                  <li>
                    Pro — {formatSetupPrice(pro.setupPrice)} : {pro.tagline}
                  </li>
                ) : null}
              </ul>
              <p>
                Les montants affichés sur le site sont des prix de création de référence, hors frais
                tiers. Le devis accepté fixe le prix contractuel.
              </p>
              <p>
                Détail des offres : <Link to="/offres">Offres</Link> ·{" "}
                <Link to="/comparatif">Comparatif</Link>.
              </p>
            </>
          ),
        },
        {
          id: "hors-perimetre",
          title: "4. Prestations hors prix de création",
          content: (
            <>
              <p>
                <strong>Hébergement et nom de domaine.</strong> {commercialNotes.hosting}
              </p>
              <p>
                <strong>Maintenance.</strong> {commercialNotes.maintenance}
              </p>
              <p>
                <strong>Outils externes.</strong> {commercialNotes.thirdParty}
              </p>
            </>
          ),
        },
        {
          id: "commande",
          title: "5. Commande et devis",
          content: (
            <>
              <p>
                Une demande via le configurateur ou le formulaire de contact constitue une prise de
                contact, non une commande. La commande naît de l’acceptation écrite d’un devis émis
                par Site AZ (référence type D-…), dans sa durée de validité.
              </p>
              <p>
                Le client professionnel reconnaît avoir reçu les informations nécessaires avant
                acceptation.
              </p>
            </>
          ),
        },
        {
          id: "paiement",
          title: "6. Prix et paiement",
          content: (
            <>
              <p>Modalités indicatives (sauf mention contraire sur le devis) : {id.paymentTerms}</p>
              <p>
                Les prix sont exprimés en euros. En franchise en base de TVA, la TVA n’est pas
                facturée tant que ce régime s’applique. Tout changement de régime sera signalé sur
                les documents commerciaux.
              </p>
              <p>
                Tout retard de paiement peut entraîner la suspension de la prestation jusqu’à
                régularisation, après relance.
              </p>
            </>
          ),
        },
        {
          id: "delais",
          title: "7. Délais et livraison",
          content: (
            <>
              <p>
                Les délais indiqués sur le devis sont prévisionnels. Ils dépendent de la
                transmission rapide des contenus et éléments demandés (textes, photos, accès
                hébergement, etc.).
              </p>
              <p>
                La livraison consiste en la mise à disposition du site sur l’environnement convenu
                (prévisualisation puis mise en ligne sur l’hébergement du client). Un suivi peut être
                proposé via l’espace client.
              </p>
            </>
          ),
        },
        {
          id: "obligations-client",
          title: "8. Obligations du client",
          content: (
            <>
              <p>Le client s’engage à :</p>
              <ul>
                <li>fournir des informations exactes et les contenus nécessaires ;</li>
                <li>disposer des droits sur les textes, images et marques transmis ;</li>
                <li>
                  souscrire et payer l’hébergement / le nom de domaine auprès du fournisseur choisi,
                  sauf disposition contraire écrite ;
                </li>
                <li>valider ou formuler des demandes de modification dans les délais convenus.</li>
              </ul>
            </>
          ),
        },
        {
          id: "propriete",
          title: "9. Propriété et licence",
          content: (
            <>
              <p>
                Après paiement intégral, le client dispose des droits d’usage sur le site livré pour
                son activité, dans les limites du devis. Site AZ conserve le droit de réutiliser
                méthodes, composants et savoir-faire non spécifiques au client.
              </p>
              <p>
                Les démonstrations et modèles du site public restent la propriété de Site AZ.
              </p>
            </>
          ),
        },
        {
          id: "retractation",
          title: "10. Droit de rétractation",
          content: (
            <>
              <p>
                Les prestations s’adressent à des clients professionnels. Le droit de rétractation
                prévu pour les consommateurs ne s’applique pas aux contrats conclus avec des
                professionnels dans le cadre de leur activité (sauf dispositions légales
                impératives contraires).
              </p>
            </>
          ),
        },
        {
          id: "responsabilite",
          title: "11. Responsabilité",
          content: (
            <>
              <p>
                Site AZ met en œuvre les moyens raisonnables pour livrer une prestation conforme au
                devis. La responsabilité est limitée au montant HT effectivement payé pour la
                prestation concernée, hors dommages corporels ou faute lourde.
              </p>
              <p>
                Site AZ n’est pas responsable des interruptions ou défaillances des services tiers
                (hébergeur, outils externes, messagerie, etc.).
              </p>
            </>
          ),
        },
        {
          id: "donnees",
          title: "12. Données personnelles",
          content: (
            <>
              <p>
                Voir la <Link to="/confidentialite">politique de confidentialité</Link>.
              </p>
            </>
          ),
        },
        {
          id: "litiges",
          title: "13. Droit applicable et litiges",
          content: (
            <>
              <p>
                Les CGV sont régies par le droit français. En cas de différend, les parties
                recherchent une solution amiable. À défaut, les tribunaux français sont compétents.
              </p>
              <p>
                Contact : <a href={`mailto:${id.email}`}>{id.email}</a>.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
