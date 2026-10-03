import { NextResponse, type NextRequest } from "next/server";
import { searchPlaces } from "@/lib/places/search";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 100);
  const results = searchPlaces(q, 8).map((p) => ({
    label: p.label,
    latitude: p.latitude,
    longitude: p.longitude,
    timeZone: p.timeZone,
  }));
  return NextResponse.json(results, { headers: { "Cache-Control": "public, max-age=86400" } });
}
