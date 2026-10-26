import { useCallback, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { TradeImage } from "~/data/types";

type Props = {
  before: TradeImage;
  after: TradeImage;
  /** Présente le couple comme illustratif (démos). */
  illustrative?: boolean;
  /** Légende métier (évite « chantier » sur bien-être, etc.). */
  caption?: string;
};

/**
 * Comparateur avant/après mutualisé (souris, tactile, clavier).
 * Une seule implémentation pour tous les métiers.
 */
export function BeforeAfter({ before, after, illustrative = true, caption }: Props) {
  const [pos, setPos] = useState(50);
  const trackRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const dragging = useRef(false);

  const setFromClientX = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(95, Math.max(5, next)));
  }, []);

  const onPointerDown = (e: ReactPointerEvent) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromClientX(e.clientX);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!dragging.current) return;
    setFromClientX(e.clientX);
  };

  const onPointerUp = (e: ReactPointerEvent) => {
    dragging.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  return (
    <figure className="before-after" aria-labelledby={labelId}>
      <div
        ref={trackRef}
        className="before-after__track"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          className="before-after__img before-after__img--before"
          src={before.src}
          alt={before.alt || "Avant"}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.visibility = "hidden";
          }}
        />
        <div
          className="before-after__after"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        >
          <img
            className="before-after__img"
            src={after.src}
            alt={after.alt || "Après"}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.visibility = "hidden";
            }}
          />
        </div>
        <span className="before-after__tag before-after__tag--before">Avant</span>
        <span className="before-after__tag before-after__tag--after">Après</span>
        <div className="before-after__line" style={{ left: `${pos}%` }} aria-hidden>
          <span className="before-after__knob" />
        </div>
        <input
          type="range"
          min={5}
          max={95}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          className="before-after__handle"
          aria-labelledby={labelId}
          aria-valuemin={5}
          aria-valuemax={95}
          aria-valuenow={Math.round(pos)}
          aria-valuetext={`${Math.round(pos)} pour cent de l’image après visible`}
        />
      </div>
      <figcaption id={labelId} className="before-after__caption">
        {illustrative
          ? (caption ??
            "Exemple illustratif — comparaison avant / après (démonstration, pas une réalisation réelle).")
          : "Comparaison avant / après."}
      </figcaption>
    </figure>
  );
}

/** État élégant si aucune paire avant/après n’est disponible. */
export function BeforeAfterPlaceholder() {
  return (
    <div className="before-after before-after--empty" role="status">
      <p>
        Module avant / après prêt — ajoutez une paire de photos cohérentes pour l’activer sur votre
        site.
      </p>
    </div>
  );
}
