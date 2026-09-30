import { useEffect, useState } from "react";
import { NavLink } from "react-router";

const links = [
  { to: "/", label: "Accueil", end: true },
  { to: "/offres", label: "Offres" },
  { to: "/demos", label: "Démos" },
  { to: "/comparatif", label: "Comparatif" },
  { to: "/espace-client", label: "Espace client" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="container site-header__inner">
        <NavLink to="/" className="site-brand" onClick={() => setOpen(false)}>
          <span className="brand-mark" aria-hidden />
          Sites Artisans
        </NavLink>
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((v) => !v)}
        >
          Menu
        </button>
        <nav id="site-nav" className={`site-nav${open ? " is-open" : ""}`}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? "active" : undefined)}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink to="/contact" className="btn btn-primary" onClick={() => setOpen(false)}>
            Parlons de votre projet
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
