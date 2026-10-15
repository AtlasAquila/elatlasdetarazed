import { redirect } from "next/navigation";
import { listMyCharts } from "@/lib/charts";
import { getSession } from "@/lib/supabase/server";

/** Acceso directo al asistente: abre la conversación con tu carta (la marcada como «mía», si no la primera). */
export default async function AlshainPage() {
  if (!(await getSession())) redirect("/entrar?siguiente=/alshain");
  const charts = await listMyCharts();
  const chart = charts.find((c) => c.is_self) ?? charts[0];
  // Sin carta no hay nada que preguntar: se crea primero.
  redirect(chart ? `/carta/${chart.id}/asistente` : "/carta/nueva");
}
