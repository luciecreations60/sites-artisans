import { NavLink } from "react-router";
import { BRAND_NAME } from "~/lib/brand";
import { publicUrl } from "~/lib/publicUrl";

type Props = {
  to?: string;
  /** Variante fond sombre (footer, admin). */
  onDark?: boolean;
  /** Affiche le monogramme AZ seul (compact). */
  markOnly?: boolean;
  className?: string;
  onClick?: () => void;
};

/**
 * Logo Site AZ — planche officielle (wordmark / mark PNG).
 */
export function SiteBrand({
  to = "/",
  onDark = false,
  markOnly = false,
  className = "",
  onClick,
}: Props) {
  const src = markOnly
    ? publicUrl("brand/logo-mark.png")
    : publicUrl(onDark ? "brand/logo-wordmark-on-dark.png" : "brand/logo-wordmark.png");

  const content = (
    <img
      src={src}
      alt=""
      className={
        markOnly ? "site-brand__logo site-brand__logo--mark" : "site-brand__logo"
      }
      width={markOnly ? 36 : 168}
      height={markOnly ? 36 : 52}
      decoding="async"
    />
  );

  if (!to) {
    return (
      <span className={`site-brand ${className}`.trim()} aria-label={BRAND_NAME}>
        {content}
      </span>
    );
  }

  return (
    <NavLink
      to={to}
      className={`site-brand ${className}`.trim()}
      onClick={onClick}
      end={to === "/"}
      aria-label={BRAND_NAME}
    >
      {content}
    </NavLink>
  );
}
