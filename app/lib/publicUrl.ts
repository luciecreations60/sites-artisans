/** Préfixe public (ex. `/sites-artisans/` sur GitHub Pages). */
function resolveBase(): string {
  const fromEnv = import.meta.env.VITE_PUBLIC_BASE as string | undefined;
  if (fromEnv) return normalize(fromEnv);

  const fromVite = import.meta.env.BASE_URL || "/";
  if (fromVite && fromVite !== "/") return normalize(fromVite);

  if (typeof window !== "undefined") {
    const { pathname } = window.location;
    if (pathname === "/sites-artisans" || pathname.startsWith("/sites-artisans/")) {
      return "/sites-artisans/";
    }
  }

  return "/";
}

function normalize(base: string): string {
  return base.endsWith("/") ? base : `${base}/`;
}

export function publicUrl(path: string): string {
  const cleaned = path.replace(/^\//, "");
  return `${resolveBase()}${cleaned}`;
}
