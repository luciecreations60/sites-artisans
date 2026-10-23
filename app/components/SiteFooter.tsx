import { Link } from "react-router";
import { SiteBrand } from "~/components/SiteBrand";
import { BRAND_TAGLINE_SHORT } from "~/lib/brand";
import { UX_LABELS } from "~/lib/configurator/bridge";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <div style={{ marginBottom: "0.85rem" }}>
            <SiteBrand to="/" onDark />
          </div>
          <p className="text-muted" style={{ margin: 0, maxWidth: "36ch" }}>
            Sites internet pour artisans & petites entreprises. Un accompagnement simple et
            humain, du premier échange à la mise en ligne.
          </p>
          <p className="text-muted" style={{ marginTop: "0.5rem", fontSize: "0.8rem", letterSpacing: "0.06em" }}>
            {BRAND_TAGLINE_SHORT}
          </p>
          <p className="text-muted" style={{ marginTop: "0.85rem", fontSize: "0.875rem" }}>
            Site en préparation — ouverture publique prévue le 1er janvier 2027.
          </p>
        </div>
        <div>
          <h4>Explorer</h4>
          <div className="footer-links">
            <Link to="/demos">Exemples</Link>
            <Link to="/offres">Offres</Link>
            <Link to="/configurateur">{UX_LABELS.personalizeMine}</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/espace-client">Espace client</Link>
          </div>
        </div>
        <div>
          <h4>Informations</h4>
          <div className="footer-links">
            <Link to="/mentions-legales">Mentions légales</Link>
            <Link to="/cgv">Conditions générales</Link>
            <Link to="/confidentialite">Confidentialité</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
