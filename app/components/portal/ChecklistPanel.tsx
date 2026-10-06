import type { ChecklistItem } from "~/lib/supabase.types";
import { formatDateFr } from "~/lib/portal";

type Props = {
  items: ChecklistItem[];
  emptyLabel?: string;
  /** Admin: toggle done */
  onToggle?: (item: ChecklistItem, done: boolean) => void;
  /** Admin: add item */
  onAdd?: (label: string) => void;
};

export function ChecklistPanel({
  items,
  emptyLabel = "Aucun élément à fournir pour le moment.",
  onToggle,
  onAdd,
}: Props) {
  return (
    <div className="portal-panel">
      {items.length === 0 ? (
        <p className="text-muted">{emptyLabel}</p>
      ) : (
        <ul className="portal-checklist">
          {items.map((item) => (
            <li key={item.id} data-done={item.done ? "1" : "0"}>
              {onToggle ? (
                <label className="portal-checklist__row">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={(e) => onToggle(item, e.target.checked)}
                  />
                  <span>{item.label}</span>
                </label>
              ) : (
                <span className="portal-checklist__row">
                  <span aria-hidden>{item.done ? "✓" : "○"}</span>
                  <span>{item.label}</span>
                </span>
              )}
              {item.due_date ? (
                <span className="portal-checklist__due text-muted">
                  {formatDateFr(item.due_date)}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {onAdd ? (
        <AddChecklistForm onAdd={onAdd} />
      ) : null}
    </div>
  );
}

function AddChecklistForm({ onAdd }: { onAdd: (label: string) => void }) {
  return (
    <form
      className="portal-inline-form"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const label = String(fd.get("label") ?? "").trim();
        if (!label) return;
        onAdd(label);
        e.currentTarget.reset();
      }}
    >
      <input name="label" placeholder="Nouvel élément…" required />
      <button type="submit" className="btn btn-ghost">
        Ajouter
      </button>
    </form>
  );
}
