import { useEffect, useId, useRef, useState } from "react";
import { NavLink } from "react-router";
import { SiteBrand } from "~/components/SiteBrand";
import { UX_LABELS } from "~/lib/configurator/bridge";

/** Nav allégée — artisans novices : voir / tarifs / contact + un seul CTA personnaliser. */
const links = [
  { to: "/", label: "Accueil", end: true },
  { to: "/demos", label: "Exemples" },
  { to: "/offres", label: "Offres" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="container site-header__inner">
        <SiteBrand onClick={() => setOpen(false)} />
        <button
          ref={toggleRef}
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls={navId}
          aria-label={open ? "Fermer le menu de navigation" : "Ouvrir le menu de navigation"}
          onClick={() => setOpen((v) => !v)}
        >
          Menu
        </button>
        <nav id={navId} className={`site-nav${open ? " is-open" : ""}`}>
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
          <NavLink to="/configurateur" className="btn btn-primary" onClick={() => setOpen(false)}>
            {UX_LABELS.personalizeMine}
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
