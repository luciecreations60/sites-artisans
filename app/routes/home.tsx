import { Link } from "react-router";
import { Personalizer } from "~/components/Personalizer";
import { offerPlans } from "~/data/offers";
import { publicUrl } from "~/lib/publicUrl";

export const meta = () => [
  { title: "Sites Artisans — Sites simples pour artisans" },
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

export default function Home() {
  return (
    <>
      <section className="marketing-hero">
        <div className="marketing-hero__bg" aria-hidden />
        <div className="container marketing-hero__grid hero-fade">
          <div className="marketing-hero__copy">
            <p className="eyebrow">Création de sites — artisans & petites entreprises</p>
            <h1>
              Votre savoir-faire mérite un site qui <em>travaille</em> pour vous.
            </h1>
            <p className="lead">
              Des sites web modernes, clairs et rapides pour les artisans — pour rassurer vos
              clients, montrer vos réalisations et recevoir davantage de demandes.
            </p>
            <div className="hero-actions">
              <Link to="/offres" className="btn btn-primary">
                Découvrir les offres
              </Link>
              <Link to="/demos" className="btn btn-outline">
                Voir les démonstrations
              </Link>
            </div>
          </div>
          <div className="marketing-hero__media" aria-hidden>
            <img
              className="marketing-hero__photo-main"
              src={publicUrl("img/menuisier/hero.jpg")}
              alt=""
            />
            <img
              className="marketing-hero__photo-secondary"
              src={publicUrl("img/menuisier/atelier.jpg")}
              alt=""
            />
            <div className="marketing-hero__float">
              <strong>Simple & efficace</strong>
              Pensé pour les artisans, sans jargon technique.
            </div>
          </div>
        </div>
      </section>

      <section className="aw-personalizer" id="personnaliser">
        <div className="container">
          <p className="eyebrow eyebrow--light">Essayez avec votre propre entreprise</p>
          <h2>Et si vous pouviez déjà vous voir dans votre futur site ?</h2>
          <p className="lead">
            Renseignez quelques informations. Les démonstrations s’adaptent à votre métier, à
            votre nom, à votre ville — et à vos goûts de couleurs et de polices.
          </p>
          <Personalizer variant="immersive" />
        </div>
      </section>

      <section className="band-dark">
        <div className="container">
          <p className="eyebrow eyebrow--light">Le constat</p>
          <h2>Ça vous parle ?</h2>
          <p className="text-muted prose-wide">
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
            <p className="text-muted prose-wide">
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

      <section className="section" id="offres">
        <div className="container">
          <p className="eyebrow">Les offres</p>
          <h2>Trois offres, une même exigence.</h2>
          <p className="text-muted prose-wide">
            Du site vitrine à la vitrine premium : chaque offre correspond à ce dont vous avez
            besoin aujourd’hui, et peut évoluer plus tard.
          </p>
          <div className="grid grid-3" style={{ marginTop: "2rem" }}>
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
                <p className="offer-price">À partir de {plan.priceFrom}</p>
                <p className="text-muted" style={{ margin: 0, fontSize: "0.9375rem" }}>
                  puis {plan.monthly}
                </p>
                <ul>
                  {plan.highlights.slice(0, 4).map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
                <Link to={`/demos?offre=${plan.tier}`} className="btn btn-ghost">
                  Voir une démo
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "var(--surface)" }}>
        <div className="container">
          <p className="eyebrow">Ma façon de travailler</p>
          <h2>Simple, pour vous comme pour moi.</h2>
          <ol className="steps" style={{ marginTop: "1.75rem" }}>
            <li>
              <strong>Premier échange</strong> — Un appel sans engagement. Vous me parlez de
              votre métier, je vous écoute.
            </li>
            <li>
              <strong>Proposition</strong> — Une maquette claire et un devis détaillé. Pas de
              surprise.
            </li>
            <li>
              <strong>Création & validation</strong> — Je construis le site, on ajuste ensemble
              jusqu’à ce que tout vous convienne.
            </li>
            <li>
              <strong>Mise en ligne</strong> — Nom de domaine, hébergement et formulaire prêts à
              recevoir des demandes.
            </li>
          </ol>
          <div className="hero-actions">
            <Link to="/contact" className="btn btn-primary">
              Parlons de votre projet
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
