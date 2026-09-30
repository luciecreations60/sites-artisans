import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  layout("./routes/marketing-layout.tsx", [
    index("./routes/home.tsx"),
    route("offres", "./routes/offres.tsx"),
    route("comparatif", "./routes/comparatif.tsx"),
    route("demos", "./routes/demos.tsx"),
    route("contact", "./routes/contact.tsx"),
    route("mentions-legales", "./routes/mentions-legales.tsx"),
    route("cgv", "./routes/cgv.tsx"),
    route("confidentialite", "./routes/confidentialite.tsx"),
    layout("./routes/espace-client.layout.tsx", [
      route("espace-client", "./routes/espace-client.tsx"),
      route("espace-client/connexion", "./routes/espace-client.connexion.tsx"),
      route("espace-client/projet/:projectId", "./routes/espace-client.projet.tsx"),
    ]),
  ]),
  ...prefix("demos/:trade", [
    index("./routes/demos.trade.tsx"),
    route("essentiel", "./routes/demos.essentiel.tsx"),
    layout("./routes/demos.avance.layout.tsx", [
      route("avance", "./routes/demos.avance.tsx"),
      route("avance/services", "./routes/demos.avance.services.tsx"),
      route("avance/realisations", "./routes/demos.avance.realisations.tsx"),
      route("avance/devis", "./routes/demos.avance.devis.tsx"),
      route("avance/contact", "./routes/demos.avance.contact.tsx"),
    ]),
    layout("./routes/demos.pro.layout.tsx", [
      route("pro", "./routes/demos.pro.tsx"),
      route("pro/services", "./routes/demos.pro.services.tsx"),
      route("pro/realisations", "./routes/demos.pro.realisations.tsx"),
      route("pro/realisations/:projectId", "./routes/demos.pro.project.tsx"),
      route("pro/devis", "./routes/demos.pro.devis.tsx"),
      route("pro/contact", "./routes/demos.pro.contact.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
