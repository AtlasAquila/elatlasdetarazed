import type { Metadata } from "next";
import { CicloLunar } from "@/components/CicloLunar";
import { CICLO_ACTUAL } from "@/lib/clima/ciclo-actual";

export const metadata: Metadata = {
  title: "Ciclo lunar",
  description: "El ciclo lunar en curso, de Luna llena a Luna llena, con sus fases, eclipses y aspectos.",
};

export default function CicloLunarPage() {
  return (
    <section className="hero">
      <div className="container reading">
        <h1 style={{ color: "var(--oro)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Ciclo lunar</h1>
        <CicloLunar ciclo={CICLO_ACTUAL} />
      </div>
    </section>
  );
}
