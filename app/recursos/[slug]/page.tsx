import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PRICE_LABEL } from "@/lib/purchase-info";
import { RESOURCES, getResource } from "@/lib/resources";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return RESOURCES.map((r) => ({ slug: r.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resource = getResource(slug);
  if (!resource) return { title: "Recursos astrológicos" };
  return { title: resource.name, description: resource.text };
}

export default async function RecursoPage({ params }: Props) {
  const { slug } = await params;
  const resource = getResource(slug);
  if (!resource) notFound();

  return (
    <section className="hero">
      <div className="container reading">
        <Link href="/recursos" className="small">
          ← Recursos astrológicos
        </Link>
        <p className="kicker" style={{ marginTop: 32 }}>
          Recurso astrológico
        </p>
        <h1>{resource.name}</h1>
        <p className="lead">{resource.text}</p>
        {resource.href ? (
          <>
            <p style={{ marginTop: 32 }}>
              <Link href={resource.href} className="btn btn-primary">
                Ver · {PRICE_LABEL}
              </Link>
            </p>
            <p className="muted small">Cada lectura se compra por separado ({PRICE_LABEL}, un solo pago, sin suscripción).</p>
          </>
        ) : (
          <p className="muted" style={{ marginTop: 32 }}>
            En preparación.
          </p>
        )}
      </div>
    </section>
  );
}
