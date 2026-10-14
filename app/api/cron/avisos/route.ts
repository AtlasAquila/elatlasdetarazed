import { NextResponse, type NextRequest } from "next/server";
import { alertMessage, upcomingEvent } from "@/lib/avisos";
import { CHART_COLUMNS, chartFromRow, type ChartRow } from "@/lib/charts";
import { pushConfigured, sendPush, type PushMessage } from "@/lib/push";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Device = { id: string; user_id: string; token: string; weekly_climate: boolean; chart_alerts: boolean; chart_id: string | null };
type Service = NonNullable<ReturnType<typeof createServiceClient>>;

const madridDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" });
const dayNumber = (iso: string) => Math.floor(new Date(iso + "T12:00:00Z").getTime() / 86_400_000);

/** El clima astral de esta semana, si ya está publicado y todavía no es de la semana pasada. */
async function weeklyPost(sb: Service, now: Date) {
  const { data } = await sb
    .from("posts")
    .select("id, slug, title, week_start, published_at")
    .eq("kind", "clima")
    .eq("published", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const today = dayNumber(madridDay.format(now));
  const age = today - dayNumber(data.week_start ?? madridDay.format(new Date(data.published_at)));
  return age >= 0 && age <= (data.week_start ? 6 : 3) ? data : null;
}

/** Marca un aviso como enviado a esta persona; false si ya se le envió. */
async function claim(sb: Service, userId: string, key: string) {
  const { error } = await sb.from("push_sent").insert({ user_id: userId, key });
  return !error;
}

async function deliver(sb: Service, devices: Device[], message: PushMessage) {
  let sent = 0;
  for (const d of devices) {
    const result = await sendPush(d.token, message);
    if (result === "ok") sent++;
    else if (result === "invalid") await sb.from("push_devices").delete().eq("id", d.id);
  }
  return sent;
}

/** Tarea diaria (vercel.json): clima semanal y avisos de la carta de cada persona. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return new NextResponse("No autorizado", { status: 401 });
  const sb = createServiceClient();
  if (!sb || !pushConfigured()) return NextResponse.json({ error: "Faltan SUPABASE_SERVICE_ROLE_KEY o FIREBASE_SERVICE_ACCOUNT" }, { status: 503 });

  const started = Date.now();
  const now = new Date();
  const { data: rows } = await sb.from("push_devices").select("id, user_id, token, weekly_climate, chart_alerts, chart_id");
  const devices = (rows as Device[] | null) ?? [];
  const byUser = new Map<string, Device[]>();
  for (const d of devices) byUser.set(d.user_id, [...(byUser.get(d.user_id) ?? []), d]);

  const post = await weeklyPost(sb, now);
  const alertUsers = [...byUser.entries()].filter(([, list]) => list.some((d) => d.chart_alerts)).map(([id]) => id);
  const { data: chartRows } = alertUsers.length
    ? await sb.from("charts").select(`${CHART_COLUMNS}, user_id`).in("user_id", alertUsers).order("is_self", { ascending: false }).order("created_at")
    : { data: [] };
  const charts = (chartRows as unknown as (ChartRow & { user_id: string })[] | null) ?? [];

  const stats = { users: byUser.size, weekly: 0, alerts: 0, errors: 0, stopped: false };
  for (const [userId, list] of byUser) {
    if (Date.now() - started > 50_000) {
      stats.stopped = true;
      break;
    }
    try {
      const weekly = list.filter((d) => d.weekly_climate);
      if (post && weekly.length && (await claim(sb, userId, `post:${post.id}`))) {
        stats.weekly += await deliver(sb, weekly, { title: "El clima astral de la semana", body: post.title, url: `/clima-astral/${post.slug}` });
      }

      const alerts = list.filter((d) => d.chart_alerts);
      if (alerts.length) {
        const mine = charts.filter((c) => c.user_id === userId);
        const row = mine.find((c) => c.id === alerts[0].chart_id) ?? mine[0];
        const found = row ? upcomingEvent(chartFromRow(row), now) : null;
        if (row && found && (await claim(sb, userId, `event:${row.id}:${found.event.kind}:${Math.round(found.event.at / 60_000)}`))) {
          stats.alerts += await deliver(sb, alerts, { ...alertMessage(found, now), url: `/carta/${row.id}` });
        }
      }
    } catch {
      stats.errors++;
    }
  }
  return NextResponse.json(stats);
}
