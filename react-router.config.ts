import type { Config } from "@react-router/dev/config";
import { TRADE_SLUGS } from "./app/data/trades";

const commercial = [
  "/",
  "/offres",
  "/comparatif",
  "/demos",
  "/espace-client",
  "/espace-client/connexion",
  "/contact",
  "/mentions-legales",
  "/cgv",
  "/confidentialite",
];

const demoPaths = TRADE_SLUGS.flatMap((trade) => [
  `/demos/${trade}`,
  `/demos/${trade}/essentiel`,
  `/demos/${trade}/avance`,
  `/demos/${trade}/avance/services`,
  `/demos/${trade}/avance/realisations`,
  `/demos/${trade}/avance/devis`,
  `/demos/${trade}/avance/contact`,
  `/demos/${trade}/pro`,
  `/demos/${trade}/pro/services`,
  `/demos/${trade}/pro/realisations`,
  `/demos/${trade}/pro/devis`,
  `/demos/${trade}/pro/contact`,
  ...[1, 2, 3, 4, 5, 6].map((n) => `/demos/${trade}/pro/realisations/p${n}`),
]);

export default {
  appDirectory: "app",
  buildDirectory: "build",
  ssr: false,
  prerender: [...commercial, ...demoPaths],
} satisfies Config;
