export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="hero">
      <div className="container reading">
        <p className="kicker">Legal</p>
        <h1>{title}</h1>
        <p className="muted small" style={{ margin: "8px 0 40px" }}>Última actualización: 4 de octubre de 2026.</p>
        <div className="article-body">{children}</div>
      </div>
    </section>
  );
}
