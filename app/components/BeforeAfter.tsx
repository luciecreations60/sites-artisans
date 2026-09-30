import { useState } from "react";
import type { TradeImage } from "~/data/types";

type Props = {
  before: TradeImage;
  after: TradeImage;
};

export function BeforeAfter({ before, after }: Props) {
  const [pos, setPos] = useState(50);

  return (
    <div className="before-after">
      <img src={before.src} alt={before.alt} />
      <div className="before-after__after" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={after.src} alt={after.alt} />
      </div>
      <div className="before-after__line" style={{ left: `${pos}%` }} aria-hidden />
      <input
        type="range"
        min={5}
        max={95}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className="before-after__handle"
        aria-label="Comparer avant et après"
      />
    </div>
  );
}
