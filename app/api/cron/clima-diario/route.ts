import { NextResponse, type NextRequest } from "next/server";
import { todayInMadrid } from "@/lib/clima-diario";
import { pushConfigured, sendPush } from "@/lib/push";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Device = { id: string; user_id: string; token: string };

/** Tarea diaria (vercel.json): avisa a todos los dispositivos de la lectura del clima astral de hoy. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return new NextResponse("No autorizado", { status: 401 });
  const sb = createServiceClient();
  if (!sb || !pushConfigured()) return NextResponse.json({ error: "Faltan SUPABASE_SERVICE_ROLE_KEY o FIREBASE_SERVICE_ACCOUNT" }, { status: 503 });

  const day = todayInMadrid();
  const { data: reading } = await sb.from("clima_diario").select("day, headline").eq("day", day).maybeSingle();
  if (!reading) return NextResponse.json({ day, sent: 0, reason: "Todavía no hay lectura para hoy" });

  const started = Date.now();
  const message = { title: "El clima astral de hoy", body: reading.headline.slice(0, 200), url: "/clima-astral" };
  const { data: rows } = await sb.from("push_devices").select("id, user_id, token").eq("daily_climate", true);
  const byUser = new Map<string, Device[]>();
  for (const d of (rows as Device[] | null) ?? []) byUser.set(d.user_id, [...(byUser.get(d.user_id) ?? []), d]);

  const stats = { day, users: byUser.size, sent: 0, skipped: 0, errors: 0, stopped: false };
  for (const [userId, devices] of byUser) {
    if (Date.now() - started > 50_000) {
      stats.stopped = true;
      break;
    }
    try {
      // Si la tarea se ejecuta dos veces, nadie recibe el aviso repetido.
      const { error } = await sb.from("push_sent").insert({ user_id: userId, key: `daily:${day}` });
      if (error) {
        stats.skipped++;
        continue;
      }
      await sb.from("reportes").insert({ user_id: userId, kind: "daily", title: message.title, body: message.body, url: message.url });
      for (const d of devices) {
        const { result } = await sendPush(d.token, message);
        if (result === "ok") stats.sent++;
        else if (result === "invalid") await sb.from("push_devices").delete().eq("id", d.id);
      }
    } catch {
      stats.errors++;
    }
  }
  return NextResponse.json(stats);
}
