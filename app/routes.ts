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
      route("espace-client/activation", "./routes/espace-client.activation.tsx"),
      route("espace-client/projet/:projectId", "./routes/espace-client.projet.tsx"),
      layout("./routes/admin.layout.tsx", [
        route("admin", "./routes/admin.tsx"),
        route("admin/prospects", "./routes/admin.prospects.tsx"),
        route("admin/prospects/parametres", "./routes/admin.prospects.parametres.tsx"),
        route("admin/prospects/campagnes", "./routes/admin.prospects.campagnes.tsx"),
        route("admin/prospects/campagnes/:campaignId", "./routes/admin.prospects.campagne.tsx"),
        route("admin/prospects/:prospectId", "./routes/admin.prospect.tsx"),
        route("admin/clients", "./routes/admin.clients.tsx"),
        route("admin/projets", "./routes/admin.projets.tsx"),
        route("admin/projets/:projectId", "./routes/admin.projet.tsx"),
        route("admin/demandes", "./routes/admin.demandes.tsx"),
        route("admin/documents", "./routes/admin.documents.tsx"),
        route("admin/maintenance", "./routes/admin.maintenance.tsx"),
      ]),
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
  // Démos prospect : wrappers → mêmes modules demos.* (ProspectDemoContext = source données)
  layout("./routes/demo.layout.tsx", [
    ...prefix("demo/:slug", [
      index("./routes/demo.index.tsx"),
      route("essentiel", "./routes/demo.essentiel.tsx"),
      layout("./routes/demo.avance.layout.tsx", [
        route("avance", "./routes/demo.avance.tsx"),
        route("avance/services", "./routes/demo.avance.services.tsx"),
        route("avance/realisations", "./routes/demo.avance.realisations.tsx"),
        route("avance/devis", "./routes/demo.avance.devis.tsx"),
        route("avance/contact", "./routes/demo.avance.contact.tsx"),
      ]),
      layout("./routes/demo.pro.layout.tsx", [
        route("pro", "./routes/demo.pro.tsx"),
        route("pro/services", "./routes/demo.pro.services.tsx"),
        route("pro/realisations", "./routes/demo.pro.realisations.tsx"),
        route("pro/realisations/:projectId", "./routes/demo.pro.project.tsx"),
        route("pro/devis", "./routes/demo.pro.devis.tsx"),
        route("pro/contact", "./routes/demo.pro.contact.tsx"),
      ]),
    ]),
  ]),
] satisfies RouteConfig;
