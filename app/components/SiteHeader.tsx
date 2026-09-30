import { useState } from "react";
import { NavLink } from "react-router";

const links = [
  { to: "/", label: "Accueil", end: true },
  { to: "/offres", label: "Offres" },
  { to: "/comparatif", label: "Comparatif" },
  { to: "/demos", label: "Démos" },
  { to: "/espace-client", label: "Espace client" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <NavLink to="/" className="site-brand" onClick={() => setOpen(false)}>
          Sites <span>Artisans</span>
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
        </nav>
      </div>
    </header>
  );
}
