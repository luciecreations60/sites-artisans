import type { ReactNode } from "react";

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="portal-empty text-muted">{children}</p>;
}

export function LoadingState({ label = "Chargement…" }: { label?: string }) {
  return <p className="text-muted">{label}</p>;
}

export function ErrorState({ message }: { message: string }) {
  return <p className="form-error">{message}</p>;
}

export function PortalSection({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="portal-section">
      <div className="portal-section__head">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
