export type TradeSlug =
  | "plombier"
  | "electricien"
  | "couvreur"
  | "peintre"
  | "paysagiste"
  | "garage"
  | "boulanger"
  | "coiffure"
  | "bienetre"
  | "cordonnier"
  | "serrurier";

export type OfferTier = "essentiel" | "avance" | "pro";

export type TradeImage = {
  src: string;
  alt: string;
};

export type TradeService = {
  title: string;
  description: string;
  priceFrom?: string;
};

export type TradeProject = {
  id: string;
  title: string;
  location: string;
  summary: string;
  image: TradeImage;
  tags: string[];
  before?: TradeImage;
  after?: TradeImage;
};

export type TradeTestimonial = {
  name: string;
  city: string;
  text: string;
};

export type TradeFaq = {
  question: string;
  answer: string;
};

export type TradePalette = {
  ink: string;
  paper: string;
  muted: string;
  accent: string;
  accentSoft: string;
  surface: string;
};

export type TradeData = {
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
  defaultPhone: string;
  defaultEmail: string;
  palette: TradePalette;
  hero: TradeImage;
  atelier: TradeImage;
  portrait: TradeImage;
  about: string;
  services: TradeService[];
  projects: TradeProject[];
  testimonials: TradeTestimonial[];
  faqs: TradeFaq[];
  estimator?: {
    label: string;
    options: { id: string; label: string; base: number; unit: string }[];
  };
};
