import { Link, NavLink, Outlet, useNavigate } from "react-router";
import { useEffect } from "react";
import { useAuth } from "~/lib/auth";
import { isAdminRole } from "~/lib/portal";
import { LoadingState } from "~/components/portal/PortalUi";

const nav = [
  { to: "/admin", label: "Tableau de bord", end: true },
  { to: "/admin/clients", label: "Clients" },
  { to: "/admin/projets", label: "Projets" },
  { to: "/admin/demandes", label: "Demandes" },
  { to: "/admin/documents", label: "Documents" },
  { to: "/admin/maintenance", label: "Maintenance" },
];

export default function AdminLayout() {
  const { loading, user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/espace-client/connexion", { replace: true });
      return;
    }
    if (!isAdminRole(profile?.role)) {
      navigate("/espace-client", { replace: true });
    }
  }, [loading, user, profile, navigate]);

  if (loading || !user || !isAdminRole(profile?.role)) {
    return (
      <section className="section">
        <div className="container">
          <LoadingState label="Chargement de l’administration…" />
        </div>
      </section>
    );
  }

  return (
    <div className="admin-shell">
      <div className="container admin-shell__inner">
        <aside className="admin-nav" aria-label="Administration">
          <p className="admin-nav__eyebrow">Administration</p>
          <nav>
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive ? "admin-nav__link is-active" : "admin-nav__link"
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="admin-nav__footer">
            <Link to="/">Site public</Link>
            <button type="button" className="btn btn-ghost" onClick={() => void signOut()}>
              Déconnexion
            </button>
          </div>
        </aside>
        <div className="admin-main">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
