export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="hero">
      <div className="container reading">
        <p className="kicker">Legal</p>
        <h1>{title}</h1>
        <p className="notice" style={{ margin: "24px 0 40px" }}>
          Borrador pendiente de revisión legal. Los datos entre corchetes se completarán antes del lanzamiento.
        </p>
        <div className="article-body">{children}</div>
      </div>
    </section>
  );
}
