import { Link } from "react-router";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <div className="site-brand" style={{ color: "#f7f1e7", marginBottom: "0.85rem" }}>
            <span className="brand-mark" aria-hidden />
            Sites Artisans
          </div>
          <p className="text-muted" style={{ margin: 0, maxWidth: "36ch" }}>
            Sites internet pour artisans & petites entreprises. Un accompagnement simple et
            humain, du premier échange à la mise en ligne.
          </p>
          <p className="text-muted" style={{ marginTop: "0.85rem", fontSize: "0.875rem" }}>
            Site en préparation — ouverture publique prévue en 2027.
          </p>
        </div>
        <div>
          <h4>Explorer</h4>
          <div className="footer-links">
            <Link to="/offres">Les offres</Link>
            <Link to="/demos">Démonstrations</Link>
            <Link to="/comparatif">Comparatif</Link>
            <Link to="/espace-client">Espace client</Link>
            <Link to="/contact">Contact</Link>
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
