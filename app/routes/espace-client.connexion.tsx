import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "~/lib/auth";
import { postLoginPath } from "~/lib/portal";

export default function EspaceClientConnexion() {
  const { configured, loading, user, profile, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && profile) {
      navigate(postLoginPath(profile.role), { replace: true });
    }
  }, [loading, user, profile, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signIn(email.trim(), password);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    // La redirection se fait via l'effet une fois le profil chargé
  }

  if (!configured) {
    return (
      <section className="section">
        <div className="container">
          <h1>Connexion</h1>
          <p className="text-muted">Configurez d’abord les variables Supabase (.env).</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "28rem" }}>
        <h1>Connexion</h1>
        <p className="text-muted">Espace client et administration Sites Artisans.</p>
        <form className="stack-form" onSubmit={onSubmit}>
          <label>
            E-mail
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={busy || loading}>
            {busy ? "Connexion…" : "Se connecter"}
          </button>
        </form>
        <p style={{ marginTop: "1.25rem" }}>
          <Link to="/espace-client">Retour</Link>
        </p>
      </div>
    </section>
  );
}

export const meta = () => [{ title: "Connexion — Sites Artisans" }];
