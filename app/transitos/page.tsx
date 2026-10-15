import type { Metadata } from "next";
import { LiveSkyWheel } from "@/components/LiveSkyWheel";

export const metadata: Metadata = {
  title: "Tránsitos",
  description: "La rueda del cielo en directo: dónde están ahora los planetas y cómo se mueven con el tiempo.",
};

export default function TransitosPage() {
  return (
    <section className="hero">
      <div className="container reading">
        <h1 style={{ color: "var(--oro)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Tránsitos</h1>
        <LiveSkyWheel />
      </div>
    </section>
  );
}
