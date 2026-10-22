import { useState } from "react";
import { Link } from "react-router";
import { Personalizer } from "~/components/Personalizer";
import {
  commercialNotes,
  formatSetupPrice,
  homeValuePropLine,
  offerPlans,
} from "~/data/offers";
import { BRAND_NAME } from "~/lib/brand";
import { publicUrl } from "~/lib/publicUrl";

/** Visuels métier existants (chemins réels sous public/img/). */
const HERO_IMAGES = {
  main: publicUrl("img/plombier/essentiel/01-hero.jpg"),
  secondary: publicUrl("img/plombier/essentiel/02-about.jpg"),
} as const;

export const meta = () => [
  { title: `${BRAND_NAME} — Sites simples pour artisans` },
];

const problems = [
  "Un site ancien… ou pas de site du tout",
  "Une présence limitée sur les réseaux sociaux",
  "Introuvable sur Google",
  "De belles réalisations qui restent dans le téléphone",
  "Des informations que vos clients ne trouvent pas",
  "Un site illisible sur mobile",
];

const solutions = [
  { title: "Professionnel", text: "Une image à la hauteur de votre savoir-faire." },
  { title: "Lisible sur téléphone", text: "Là où vos clients vous cherchent vraiment." },
  { title: "Clair", text: "Services, réalisations, coordonnées : tout se trouve vite." },
  { title: "Rapide", text: "Un site qui s’affiche vite, même avec une connexion moyenne." },
  { title: "À votre image", text: "Pas de modèle générique : un site qui ressemble à votre entreprise." },
  { title: "Pensé pour le contact", text: "Appel, message ou devis : vos clients savent quoi faire." },
];

const journey = [
  {
    title: "Personnalisez votre futur site",
    text: "Choisissez votre métier, votre identité visuelle et vos besoins. La simulation est personnalisable et pourra être modifiée.",
  },
  {
    title: "Échangeons sur votre projet",
    text: "Nous validons ensemble les derniers détails et les prestations sélectionnées.",
  },
  {
    title: "Suivez la création",
    text: "Votre site est adapté, puis vous pouvez le consulter et demander les ajustements prévus dans votre formule.",
  },
  {
    title: "Votre site est en ligne",
    text: "Je vous accompagne dans sa publication sur l’hébergement que vous avez choisi.",
  },
];

const trustPoints = [
  {
    title: "Vous n’avez pas besoin d’être à l’aise avec l’informatique.",
    text: "Vous décrivez votre activité ; je m’occupe de la technique, de la structure du site et des réglages. Les échanges restent en français clair, sans jargon.",
  },
  {
    title: "Vous parlez toujours à la même personne.",
    text: "Du premier contact à la mise en ligne, c’est moi qui suis votre dossier. Vous savez à qui écrire, et vos demandes ne se perdent pas dans un standard.",
  },
];

export default function Home() {
  const valueProp = homeValuePropLine();
  const [mainBroken, setMainBroken] = useState(false);
  const [secondaryBroken, setSecondaryBroken] = useState(false);
  const bothBroken = mainBroken && secondaryBroken;

  return (
    <>
      <section className="marketing-hero">
        <div className="marketing-hero__bg" aria-hidden />
        <div className="container marketing-hero__grid hero-fade">
          <div className="marketing-hero__copy">
            <p className="eyebrow">Création de sites — artisans & petites entreprises</p>
            <h1>Votre savoir-faire mérite d’être visible.</h1>
            <p className="hero-subtitle">
              Vous êtes excellent dans votre métier. Votre site internet doit l’être aussi.
            </p>
            <p className="lead marketing-hero__lead">
              Créez un site professionnel qui vous ressemble, mettez en valeur vos réalisations et
              permettez à vos futurs clients de vous contacter facilement.
            </p>
            <p className="hero-value-prop">{valueProp}</p>
            <div className="hero-actions">
              <Link to="/configurateur" className="btn btn-primary">
                Personnaliser mon futur site
              </Link>
              <Link to="/offres" className="btn btn-outline">
                Découvrir les offres
              </Link>
            </div>
          </div>
          <div className="marketing-hero__media" aria-hidden>
            {bothBroken ? (
              <div className="marketing-hero__fallback">Exemple de vitrine artisan</div>
            ) : (
              <>
                <img
                  className={`marketing-hero__photo-main${mainBroken ? " is-broken" : ""}`}
                  src={HERO_IMAGES.main}
                  alt=""
                  width={720}
                  height={900}
                  onError={() => setMainBroken(true)}
                />
                <img
                  className={`marketing-hero__photo-secondary${secondaryBroken ? " is-broken" : ""}`}
                  src={HERO_IMAGES.secondary}
                  alt=""
                  width={480}
                  height={384}
                  onError={() => setSecondaryBroken(true)}
                />
              </>
            )}
          </div>
        </div>
      </section>

      <section className="section section--tight trust-band" aria-labelledby="trust-heading">
        <div className="container">
          <p className="eyebrow">Accompagnement</p>
          <h2 id="trust-heading">Un suivi simple, pensé pour votre quotidien.</h2>
          <p className="lead section-lead">
            L’objectif : un site qui vous aide à être contacté, sans vous transformer en
            webmaster.
          </p>
          <div className="trust-grid">
            {trustPoints.map((item) => (
              <article key={item.title} className="trust-card">
                <h3>{item.title}</h3>
                <p className="text-muted">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="aw-personalizer" id="personnaliser">
        <div className="container">
          <p className="eyebrow eyebrow--light">Essayez avec votre propre entreprise</p>
          <h2>Et si vous pouviez déjà vous voir dans votre futur site ?</h2>
          <p className="lead">
            Pour composer votre formule et voir votre tarif évoluer, ouvrez le{" "}
            <Link to="/configurateur" style={{ color: "var(--eyebrow-light)" }}>
              configurateur
            </Link>
            . Ci-dessous, personnalisez aussi les démonstrations avec votre métier, votre nom et
            vos couleurs.
          </p>
          <div className="hero-actions" style={{ marginBottom: "1.25rem" }}>
            <Link to="/configurateur" className="btn btn-primary">
              Ouvrir le configurateur
            </Link>
          </div>
          <Personalizer variant="immersive" />
        </div>
      </section>

      <section className="band-dark">
        <div className="container">
          <p className="eyebrow eyebrow--light">Le constat</p>
          <h2>Ça vous parle ?</h2>
          <p className="text-muted section-lead">
            Beaucoup d’artisans font très bien leur métier — mais leur présence en ligne ne le
            montre pas.
          </p>
          <div className="problem-grid">
            {problems.map((item) => (
              <div key={item} className="problem-card">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="solution-panel">
            <p className="eyebrow">La solution</p>
            <h2>Un site à votre image, sans vous compliquer la vie.</h2>
            <p className="text-muted section-lead">
              Des sites pensés pour votre métier et pour vos clients : clairs, rassurants, et
              faciles à utiliser au quotidien.
            </p>
            <div className="solution-grid">
              {solutions.map((item) => (
                <div key={item.title}>
                  <h3>{item.title}</h3>
                  <p className="text-muted" style={{ margin: 0 }}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section journey-section" aria-labelledby="journey-heading">
        <div className="container">
          <p className="eyebrow">Le parcours</p>
          <h2 id="journey-heading">Quatre étapes, du premier aperçu à la mise en ligne.</h2>
          <p className="lead section-lead">
            Vous avancez à votre rythme : personnalisation, échange, création, puis publication
            sur l’hébergement que vous avez choisi.
          </p>
          <ol className="journey-grid">
            {journey.map((step, index) => (
              <li key={step.title} className="journey-card">
                <span className="journey-card__num" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{step.title}</h3>
                <p className="text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" id="offres" style={{ background: "var(--surface)" }}>
        <div className="container">
          <p className="eyebrow">Les offres</p>
          <h2>Trois formules de création, une même exigence.</h2>
          <p className="text-muted section-lead">
            {commercialNotes.setupOnly} L’hébergement n’est pas inclus ; la maintenance reste
            facultative.
          </p>
          <div className="grid grid-3 offer-grid">
            {offerPlans.map((plan) => (
              <article
                key={plan.tier}
                className={`offer-card${plan.tier === "avance" ? " offer-card--featured" : ""}`}
              >
                {plan.tier === "avance" && <span className="offer-chip">Le plus choisi</span>}
                <h3>{plan.name}</h3>
                <p className="text-muted" style={{ margin: 0 }}>
                  {plan.tagline}
                </p>
                <p className="offer-price">
                  <span className="offer-price__label">Création</span>
                  {formatSetupPrice(plan.setupPrice)}
                </p>
                <ul>
                  {plan.highlights.slice(0, 4).map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
                <Link
                  to={`/configurateur?formule=${plan.tier}&parcours=formula`}
                  className="btn btn-ghost"
                >
                  Personnaliser
                </Link>
              </article>
            ))}
          </div>
          <p className="commercial-footnote text-muted">
            {commercialNotes.hosting} {commercialNotes.maintenance}
          </p>
          <div className="hero-actions">
            <Link to="/offres" className="btn btn-outline">
              Voir le détail des offres
            </Link>
            <Link to="/comparatif" className="btn btn-ghost">
              Comparer les formules
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container cta-band">
          <div>
            <p className="eyebrow">Prochaine étape</p>
            <h2>Parlons de votre projet.</h2>
            <p className="lead section-lead" style={{ marginBottom: 0 }}>
              Un message suffit pour démarrer. Je vous réponds sous 24 à 48 h, sans engagement.
            </p>
          </div>
          <div className="hero-actions" style={{ marginTop: 0 }}>
            <Link to="/contact" className="btn btn-primary">
              Parlons de votre projet
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
