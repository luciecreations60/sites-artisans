import type { ReactNode } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import appStyles from "./app.css?url";

export const links = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;700;800&family=Bitter:wght@500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500;1,9..144,600&family=Hanken+Grotesk:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&family=Spectral:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Work+Sans:wght@400;500;600;700&display=swap",
  },
  { rel: "stylesheet", href: appStyles },
];

export const meta = () => [
  { charSet: "utf-8" },
  { name: "viewport", content: "width=device-width, initial-scale=1" },
  { title: "Sites Artisans — Sites web pour artisans" },
  { name: "robots", content: "noindex, nofollow" },
  { name: "googlebot", content: "noindex" },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: { error: unknown }) {
  let message = "Une erreur est survenue.";
  let details = "Rechargez la page ou revenez à l’accueil.";
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "Page introuvable" : `Erreur ${error.status}`;
    details = error.statusText || details;
  }
  return (
    <main className="container section">
      <h1>{message}</h1>
      <p className="text-muted">{details}</p>
      <p>
        <a href={import.meta.env.BASE_URL || "/"}>Retour à l’accueil</a>
      </p>
    </main>
  );
}
