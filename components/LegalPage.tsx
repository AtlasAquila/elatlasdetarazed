export function LegalPage({ title, children, updated = "6 de octubre de 2026" }: { title: string; children: React.ReactNode; updated?: string }) {
  return (
    <section className="hero">
      <div className="container reading">
        <p className="kicker">Legal</p>
        <h1>{title}</h1>
        <p className="muted small" style={{ margin: "8px 0 40px" }}>Última actualización: {updated}.</p>
        <div className="article-body">{children}</div>
      </div>
    </section>
  );
}
