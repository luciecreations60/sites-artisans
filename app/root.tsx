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
    href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Source+Sans+3:wght@400;500;600;700&display=swap",
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
        <a href="/">Retour à l’accueil</a>
      </p>
    </main>
  );
}
