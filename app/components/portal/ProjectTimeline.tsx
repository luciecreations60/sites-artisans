import type { ProjectStatus } from "~/lib/supabase.types";
import { PROJECT_STATUS_LABELS } from "~/lib/supabase.types";
import { formatDateFr, PROJECT_STATUS_ORDER, statusIndex } from "~/lib/portal";
import type { ProjectEvent } from "~/lib/supabase.types";

type Props = {
  status: ProjectStatus;
  events: ProjectEvent[];
  /** Afficher aussi les jalons du workflow même sans events. */
  showWorkflow?: boolean;
};

export function ProjectTimeline({ status, events, showWorkflow = true }: Props) {
  const current = statusIndex(status);
  const sorted = [...events].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  return (
    <div className="portal-timeline">
      {showWorkflow && (
        <ol className="portal-timeline__workflow" aria-label="Étapes du projet">
          {PROJECT_STATUS_ORDER.map((step, i) => {
            const done =
              i < current || (i === current && status === "en_ligne");
            const active = i === current && status !== "en_ligne";
            const mark = done ? "✓" : active ? "●" : "○";
            return (
              <li
                key={step}
                className={done ? "is-done" : active ? "is-active" : "is-todo"}
              >
                <span className="portal-timeline__mark" aria-hidden>
                  {mark}
                </span>
                <span className="portal-timeline__label">{PROJECT_STATUS_LABELS[step]}</span>
              </li>
            );
          })}
        </ol>
      )}

      {sorted.length > 0 && (
        <>
          <h3 className="portal-timeline__history-title">Historique</h3>
          <ol className="portal-timeline__history">
            {sorted.map((ev) => (
              <li key={ev.id}>
                <div className="portal-timeline__event-head">
                  <strong>{ev.label}</strong>
                  <time dateTime={ev.created_at}>{formatDateFr(ev.created_at)}</time>
                </div>
                {ev.detail ? <p className="text-muted">{ev.detail}</p> : null}
              </li>
            ))}
          </ol>
        </>
      )}

      {sorted.length === 0 && !showWorkflow && (
        <p className="text-muted">Aucune étape enregistrée pour l’instant.</p>
      )}
    </div>
  );
}
