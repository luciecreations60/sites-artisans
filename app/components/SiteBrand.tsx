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
 * Logo Site AZ d’après la planche de marque
 * (monogramme PNG planche + wordmark « Site »).
 */
export function SiteBrand({
  to = "/",
  onDark = false,
  markOnly = false,
  className = "",
  onClick,
}: Props) {
  // Compact / admin : carré sauge (planche). Wordmark : « Site » + AZ transparent.
  const markSrc = publicUrl("brand/logo-mark.png");
  const azSrc = publicUrl(onDark ? "brand/az-mark-on-dark.png" : "brand/az-mark.png");

  const content = markOnly ? (
    <img
      src={markSrc}
      alt=""
      className="site-brand__logo site-brand__logo--mark"
      width={36}
      height={36}
      decoding="async"
    />
  ) : (
    <>
      <span className={`site-brand__word${onDark ? " site-brand__word--on-dark" : ""}`} aria-hidden="true">
        Site
      </span>
      <img
        src={azSrc}
        alt=""
        aria-hidden="true"
        className="site-brand__az"
        width={44}
        height={44}
        decoding="async"
      />
    </>
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
