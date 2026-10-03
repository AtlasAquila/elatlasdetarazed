import Link from "next/link";
import { AquilaConstellation } from "@/components/Art";

export default function NotFound() {
  return (
    <section className="hero">
      <div className="container reading" style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <AquilaConstellation size={180} />
        </div>
        <p className="kicker">Error 404</p>
        <h1>Esta página no está en el mapa</h1>
        <p className="lead">Puede que el enlace haya cambiado.</p>
        <Link href="/" className="btn btn-primary">
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}
