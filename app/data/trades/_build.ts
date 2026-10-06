import type {
  TradeData,
  TradeFaq,
  TradeImage,
  TradePalette,
  TradeProject,
  TradeService,
  TradeSlug,
  TradeTestimonial,
} from "../types";
import { publicUrl } from "../../lib/publicUrl";
import { getTradeMedia } from "./media";

type Seed = {
  slug: TradeSlug;
  label: string;
  labelPlural: string;
  shortLabel: string;
  tagline: string;
  specialty: string;
  defaultFirstName: string;
  defaultLastName: string;
  defaultCompany: string;
  defaultCity: string;
  palette: TradePalette;
  about: string;
  services: TradeService[];
  projectTitles: [string, string, string, string, string, string];
  projectSummaries: [string, string, string, string, string, string];
  projectTags: [string[], string[], string[], string[], string[], string[]];
  testimonials: TradeTestimonial[];
  faqs: TradeFaq[];
  estimator?: TradeData["estimator"];
  hasBeforeAfter?: boolean;
};

function img(slug: TradeSlug, name: string, alt: string): TradeImage {
  const withExt = name.includes(".") ? name : `${name}.jpg`;
  return { src: publicUrl(`img/${slug}/${withExt}`), alt };
}

export function buildTrade(seed: Seed): TradeData {
  // Chemins par défaut = offre Avancé (hub démos). Les pages démo
  // rappellent applyTierMedia() pour Essentiel / Avancé / Pro.
  const pack = getTradeMedia(seed.slug)?.avance;

  const projects: TradeProject[] = seed.projectTitles.map((title, i) => {
    const id = `p${i + 1}`;
    const imageName = pack
      ? pack.realisations[i] ?? pack.realisations[0]
      : `avance_${i + 3}`;
    const project: TradeProject = {
      id,
      title,
      location: seed.defaultCity,
      summary: seed.projectSummaries[i],
      image: img(seed.slug, imageName, title),
      tags: seed.projectTags[i],
    };
    if (seed.hasBeforeAfter && i === 0) {
      const before = getTradeMedia(seed.slug)?.pro.before ?? "pro_2";
      const after = getTradeMedia(seed.slug)?.pro.after ?? "pro_3";
      project.before = img(seed.slug, before, `Avant — ${title}`);
      project.after = img(seed.slug, after, `Après — ${title}`);
    }
    return project;
  });

  return {
    slug: seed.slug,
    label: seed.label,
    labelPlural: seed.labelPlural,
    shortLabel: seed.shortLabel,
    tagline: seed.tagline,
    specialty: seed.specialty,
    defaultFirstName: seed.defaultFirstName,
    defaultLastName: seed.defaultLastName,
    defaultCompany: seed.defaultCompany,
    defaultCity: seed.defaultCity,
    defaultPhone: "06 12 34 56 78",
    defaultEmail: "contact@atelier-demo.fr",
    palette: seed.palette,
    hero: img(
      seed.slug,
      pack ? pack.hero : "avance_1",
      `${seed.label} — ${seed.specialty}`,
    ),
    atelier: img(
      seed.slug,
      pack ? pack.about : "avance_2",
      `Atelier ${seed.label.toLowerCase()}`,
    ),
    portrait: img(
      seed.slug,
      pack ? pack.about : "avance_2",
      `Portrait artisan ${seed.label.toLowerCase()}`,
    ),
    about: seed.about,
    services: seed.services,
    projects,
    testimonials: seed.testimonials,
    faqs: seed.faqs,
    estimator: seed.estimator,
  };
}
