import type { CSSProperties, ReactNode } from "react";
import type { TradeData } from "~/data/types";

type Props = {
  trade: TradeData;
  children: ReactNode;
  className?: string;
};

export function TradeTheme({ trade, children, className }: Props) {
  const style = {
    "--trade-ink": trade.palette.ink,
    "--trade-paper": trade.palette.paper,
    "--trade-muted": trade.palette.muted,
    "--trade-accent": trade.palette.accent,
    "--trade-accent-soft": trade.palette.accentSoft,
    "--trade-surface": trade.palette.surface,
  } as CSSProperties;

  return (
    <div data-trade={trade.slug} style={style} className={className}>
      {children}
    </div>
  );
}
