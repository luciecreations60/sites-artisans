type Props = { title: string };

export function LegalPlaceholder({ title }: Props) {
  return (
    <section className="section">
      <div className="container">
        <h1>{title}</h1>
        <p className="text-muted">
          Document en cours de rédaction — micro-entreprise au 1<sup>er</sup> janvier 2027.
        </p>
        <p>
          Les informations légales complètes (éditeur, hébergeur, responsable de publication)
          seront publiées avant l’ouverture au public.
        </p>
      </div>
    </section>
  );
}
