import { Link } from "react-router";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <strong>Sites Artisans</strong>
          <p className="text-muted" style={{ margin: "0.35rem 0 0", maxWidth: "32ch" }}>
            Sites web simples pour artisans et petites entreprises du bâtiment et des
            services de proximité.
          </p>
          <p className="text-muted" style={{ marginTop: "0.75rem", fontSize: "0.875rem" }}>
            Site privé — lancement prévu le 1<sup>er</sup> janvier 2027.
          </p>
        </div>
        <div>
          <p style={{ margin: "0 0 0.5rem", fontWeight: 600 }}>Informations légales</p>
          <p style={{ margin: 0, display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <Link to="/mentions-legales">Mentions légales</Link>
            <Link to="/cgv">Conditions générales</Link>
            <Link to="/confidentialite">Confidentialité</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
