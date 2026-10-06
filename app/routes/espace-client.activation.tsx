import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "~/lib/auth";
import { getSupabase } from "~/lib/supabase";
import { postLoginPath } from "~/lib/portal";

/**
 * Page d'arrivée des liens d'invitation Supabase (generateLink type invite).
 * Doit fonctionner en navigation directe / privée (fallback GH Pages 404.html → SPA).
 */
export default function EspaceClientActivation() {
  const { configured, loading, user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    if (!configured) return;
    const sb = getSupabase();
    if (!sb) return;

    let active = true;

    async function syncFromUrl() {
      // detectSessionInUrl traite le hash ; on attend la session invite
      const { data } = await sb!.auth.getSession();
      if (!active) return;
      if (data.session) {
        setSessionReady(true);
        await refreshProfile();
        return;
      }
      // Petit délai pour laisser le client parser le hash après redirect
      await new Promise((r) => setTimeout(r, 400));
      if (!active) return;
      const again = await sb!.auth.getSession();
      if (again.data.session) {
        setSessionReady(true);
        await refreshProfile();
      } else {
        setSessionReady(false);
      }
    }

    void syncFromUrl();

    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (session && (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY" || event === "INITIAL_SESSION")) {
        setSessionReady(true);
        void refreshProfile();
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [configured, refreshProfile]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== password2) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    const sb = getSupabase();
    if (!sb) {
      setError("Supabase non configuré.");
      return;
    }
    setBusy(true);
    const { error: updErr } = await sb.auth.updateUser({ password });
    setBusy(false);
    if (updErr) {
      setError(updErr.message);
      return;
    }
    setOk("Mot de passe enregistré.");
    await refreshProfile();
    const sb2 = getSupabase();
    let role: "admin" | "client" = "client";
    if (sb2) {
      const { data: sess } = await sb2.auth.getUser();
      if (sess.user) {
        const { data: prof } = await sb2
          .from("profiles")
          .select("role")
          .eq("id", sess.user.id)
          .maybeSingle();
        if (prof?.role === "admin" || prof?.role === "client") role = prof.role;
      }
    }
    navigate(postLoginPath(role), { replace: true });
  }

  if (!configured) {
    return (
      <section className="section">
        <div className="container">
          <h1>Activation</h1>
          <p className="text-muted">Configurez d’abord les variables Supabase (.env).</p>
        </div>
      </section>
    );
  }

  if (loading && !sessionReady) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: "28rem" }}>
          <h1>Activation</h1>
          <p className="text-muted">Vérification du lien d’invitation…</p>
        </div>
      </section>
    );
  }

  if (!user && !sessionReady) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: "28rem" }}>
          <h1>Activation</h1>
          <p className="form-error">
            Lien d’invitation invalide ou expiré. Demandez un nouvel envoi à Sites Artisans.
          </p>
          <p style={{ marginTop: "1.25rem" }}>
            <Link to="/espace-client/connexion">Aller à la connexion</Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "28rem" }}>
        <h1>Activer mon espace</h1>
        <p className="text-muted">
          Définissez votre mot de passe pour accéder à votre espace client
          {user?.email ? ` (${user.email})` : ""}.
        </p>
        <form className="stack-form" onSubmit={(e) => void onSubmit(e)}>
          <label>
            Mot de passe
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label>
            Confirmer le mot de passe
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          {ok && <p className="portal-success">{ok}</p>}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Enregistrement…" : "Activer mon compte"}
          </button>
        </form>
      </div>
    </section>
  );
}

export const meta = () => [{ title: "Activation — Sites Artisans" }];
