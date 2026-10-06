import type { ChangeRequest } from "~/lib/supabase.types";
import { changeStatusLabel, formatDateFr } from "~/lib/portal";

type Props = {
  requests: ChangeRequest[];
  emptyLabel?: string;
  onStatusChange?: (req: ChangeRequest, status: ChangeRequest["status"]) => void;
};

export function ChangeRequestsList({
  requests,
  emptyLabel = "Aucune demande pour le moment.",
  onStatusChange,
}: Props) {
  if (requests.length === 0) {
    return <p className="text-muted">{emptyLabel}</p>;
  }

  return (
    <ul className="portal-requests">
      {requests.map((req) => (
        <li key={req.id} className="portal-request-card">
          <div className="portal-request-card__head">
            <h3>{req.title}</h3>
            <time dateTime={req.created_at}>{formatDateFr(req.created_at)}</time>
          </div>
          <p className="portal-request-card__status">
            Statut : <strong>{changeStatusLabel(req.status)}</strong>
          </p>
          <blockquote className="portal-request-card__body">{req.description}</blockquote>
          {onStatusChange ? (
            <label className="portal-request-card__admin">
              Mettre à jour
              <select
                value={req.status}
                onChange={(e) =>
                  onStatusChange(req, e.target.value as ChangeRequest["status"])
                }
              >
                <option value="ouvert">Ouverte</option>
                <option value="en_cours">En cours</option>
                <option value="besoin_info">Besoin d’information</option>
                <option value="termine">Terminée</option>
                <option value="refuse">Refusée</option>
              </select>
            </label>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
