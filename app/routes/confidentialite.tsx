import { Link } from "react-router";
import { LegalDocument } from "~/components/LegalDocument";
import { brandTitle } from "~/lib/brand";
import {
  LEGAL_IDENTITY,
  legalAddressLabel,
  legalSiretLabel,
} from "~/lib/legal";

export const meta = () => [{ title: brandTitle("Confidentialité") }];

export default function Confidentialite() {
  const id = LEGAL_IDENTITY;

  return (
    <LegalDocument
      title="Politique de confidentialité"
      intro={
        <>
          Cette politique décrit comment {id.tradeName} collecte et utilise les données
          personnelles dans le cadre du site public, du configurateur, de l’espace client et du
          suivi commercial. Elle s’inscrit dans le Règlement (UE) 2016/679 (RGPD) et la loi
          « Informatique et Libertés ».
        </>
      }
      sections={[
        {
          id: "responsable",
          title: "1. Responsable du traitement",
          content: (
            <>
              <p>
                Responsable : <strong>{id.legalName}</strong> ({id.tradeName}), représenté par{" "}
                {id.publisherName}.
              </p>
              <ul>
                <li>Adresse : {legalAddressLabel(id)}</li>
                <li>SIRET : {legalSiretLabel(id)}</li>
                <li>
                  Contact : <a href={`mailto:${id.email}`}>{id.email}</a>
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "finalites",
          title: "2. Données collectées et finalités",
          content: (
            <>
              <p>Selon les usages, peuvent être traités :</p>
              <ul>
                <li>
                  <strong>Formulaire de contact</strong> — identité, e-mail, message : répondre à
                  votre demande.
                </li>
                <li>
                  <strong>Demande commerciale (configurateur)</strong> — coordonnées, entreprise,
                  métier, options choisies, montants de simulation : préparer un devis et le suivi
                  commercial.
                </li>
                <li>
                  <strong>Espace client</strong> — compte (e-mail, mot de passe géré par le
                  prestataire d’auth), projets, documents, demandes de modification : exécuter et
                  suivre la prestation.
                </li>
                <li>
                  <strong>Personnalisation locale</strong> — préférences de démonstration stockées
                  dans votre navigateur (profil local) : améliorer l’aperçu ; ces données ne sont
                  pas envoyées tant que vous ne soumettez pas une demande.
                </li>
                <li>
                  <strong>Données techniques</strong> — logs nécessaires au fonctionnement et à la
                  sécurité (par ex. limitation d’abus sur les formulaires).
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "bases",
          title: "3. Bases légales",
          content: (
            <>
              <ul>
                <li>Mesures précontractuelles / contrat — devis, prestation, espace client.</li>
                <li>Intérêt légitime — répondre aux messages, prévenir les abus, améliorer le site.</li>
                <li>Obligation légale — conservation comptable ou fiscale le cas échéant.</li>
                <li>Consentement — lorsque requis (par ex. certains cookies non essentiels, s’ils sont introduits).</li>
              </ul>
            </>
          ),
        },
        {
          id: "destinataires",
          title: "4. Destinataires et sous-traitants",
          content: (
            <>
              <p>
                Les données sont traitées par Site AZ. Des sous-traitants techniques interviennent
                pour l’hébergement et l’infrastructure :
              </p>
              <ul>
                <li>
                  <strong>Supabase</strong> — base de données, authentification et fonctions liées à
                  l’espace client / CRM (traitement pour le compte de Site AZ).
                </li>
                <li>
                  <strong>GitHub Pages</strong> — hébergement du site public (contenu statique).
                </li>
                <li>
                  Prestataire d’envoi d’e-mails (SMTP), lorsqu’il est configuré, pour les
                  confirmations et invitations espace client.
                </li>
              </ul>
              <p>
                Aucune vente de fichiers à des tiers. Des transferts hors UE peuvent intervenir via
                ces prestataires ; des garanties contractuelles appropriées sont alors recherchées.
              </p>
            </>
          ),
        },
        {
          id: "duree",
          title: "5. Durées de conservation",
          content: (
            <>
              <ul>
                <li>Demandes de contact / commerciales sans suite : durée raisonnable de suivi, puis archivage ou suppression.</li>
                <li>Clients et projets : durée de la relation + obligations légales (ex. facturation).</li>
                <li>Comptes espace client : tant que le compte est actif, puis suppression ou anonymisation sur demande / fin de relation.</li>
                <li>Logs techniques : durée limitée au besoin de sécurité et de diagnostic.</li>
              </ul>
            </>
          ),
        },
        {
          id: "droits",
          title: "6. Vos droits",
          content: (
            <>
              <p>
                Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, de
                portabilité (lorsque applicable) et d’opposition, dans les conditions du RGPD.
              </p>
              <p>
                Pour exercer vos droits : <a href={`mailto:${id.email}`}>{id.email}</a>. Une pièce
                d’identité peut être demandée en cas de doute sur l’identité du demandeur.
              </p>
              <p>
                Vous pouvez introduire une réclamation auprès de la CNIL (
                <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">
                  www.cnil.fr
                </a>
                ).
              </p>
            </>
          ),
        },
        {
          id: "cookies",
          title: "7. Cookies et stockage local",
          content: (
            <>
              <p>
                Le site utilise des mécanismes techniques nécessaires au fonctionnement (session
                d’authentification espace client / admin, préférences de démonstration en local).
              </p>
              <p>
                Aucun bandeau publicitaire tiers n’est déployé à ce stade. Si des cookies non
                essentiels étaient ajoutés, un mécanisme de consentement adapté serait mis en place.
              </p>
            </>
          ),
        },
        {
          id: "securite",
          title: "8. Sécurité",
          content: (
            <>
              <p>
                Des mesures techniques et organisationnelles raisonnables sont appliquées (accès
                restreints, HTTPS, politiques d’accès côté base). Aucun système n’est infaillible ;
                en cas d’incident affectant vos données, les obligations de notification applicables
                seront respectées.
              </p>
            </>
          ),
        },
        {
          id: "maj",
          title: "9. Mises à jour",
          content: (
            <>
              <p>
                Cette politique peut être mise à jour pour refléter l’évolution du service ou de la
                réglementation. La date indiquée en tête de page fait foi. Pour toute question :{" "}
                <Link to="/contact">Contact</Link> ou{" "}
                <a href={`mailto:${id.email}`}>{id.email}</a>.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
