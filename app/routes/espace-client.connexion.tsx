import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "~/lib/auth";

export default function EspaceClientConnexion() {
  const { configured, loading, user, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/espace-client", { replace: true });
  }, [loading, user, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signIn(email.trim(), password);
    setBusy(false);
    if (res.error) setError(res.error);
    else navigate("/espace-client", { replace: true });
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
        <h1>Connexion espace client</h1>
        <p className="text-muted">Identifiants fournis lors de l’ouverture de votre dossier.</p>
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
          <button type="submit" className="btn btn-primary" disabled={busy}>
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

export const meta = () => [{ title: "Connexion — Espace client" }];
