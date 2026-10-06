/** Types partagés pour les manifests média par métier. */
export type TierMediaPack = {
  hero: string;
  about: string;
  realisations: string[];
  before?: string;
  after?: string;
  services?: string[];
};

export type TradeMediaManifest = Record<"essentiel" | "avance" | "pro", TierMediaPack>;
