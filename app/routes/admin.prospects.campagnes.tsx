import { useEffect, useState } from "react";
import { Link } from "react-router";
import { trades } from "~/data/trades";
import { formatDateFr } from "~/lib/portal";
import type { ProspectEmail, ProspectEmailCampaign } from "~/lib/prospectEmail.types";
import { getSupabase } from "~/lib/supabase";
import { useCrmRefs } from "~/lib/useCrmRefs";
import { ErrorState, LoadingState } from "~/components/portal/PortalUi";

export const meta = () => [{ title: "Campagnes e-mail — Administration" }];

export default function AdminProspectCampaigns() {
  const { refs, byId } = useCrmRefs();
  const [campaigns, setCampaigns] = useState<ProspectEmailCampaign[]>([]);
  const [emails, setEmails] = useState<ProspectEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    void (async () => {
      const [c, e] = await Promise.all([
        sb
          .from("prospect_email_campaigns")
          .select("*")
          .order("created_at", { ascending: false }),
        sb.from("prospect_emails").select("id, campaign_id, email_status_id"),
      ]);
      if (c.error) setError(c.error.message);
      setCampaigns((c.data as ProspectEmailCampaign[]) ?? []);
      setEmails((e.data as ProspectEmail[]) ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="admin-page">
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <p>
        <Link to="/admin/prospects">← Prospects</Link>
      </p>
      <header className="admin-page__header">
        <h1>Campagnes e-mail</h1>
        <p className="text-muted">
          Prospection B2B ciblée — file d’attente persistante (pas de newsletter).
        </p>
      </header>
      {error && <ErrorState message={error} />}
      {campaigns.length === 0 ? (
        <p className="text-muted">
          Aucune campagne. Sélectionnez des prospects dans la liste puis « Créer une campagne ».
        </p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table crm-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Métier</th>
                <th>Statut</th>
                <th>Progression</th>
                <th>Créée</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const related = emails.filter((e) => e.campaign_id === c.id);
                const sent = related.filter(
                  (e) => byId(refs.emailStatuses, e.email_status_id)?.code === "sent",
                ).length;
                return (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/admin/prospects/campagnes/${c.id}`}>
                        <strong>{c.name}</strong>
                      </Link>
                    </td>
                    <td>
                      {c.trade_slug
                        ? trades[c.trade_slug as keyof typeof trades]?.label ?? c.trade_slug
                        : "—"}
                    </td>
                    <td>{byId(refs.campaignStatuses, c.status_id)?.label ?? "—"}</td>
                    <td>
                      {sent} / {related.length}
                    </td>
                    <td>{formatDateFr(c.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
