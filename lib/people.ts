import { createClient } from "@/lib/supabase/server";

export type PersonRow = {
  id: string;
  full_name: string;
  current_name: string | null;
  birth_date: string; // YYYY-MM-DD
  label: string | null;
  is_self: boolean;
  created_at: string;
};

export const PERSON_COLUMNS = "id, full_name, current_name, birth_date, label, is_self, created_at";

/** Personas que se pueden guardar en todos los planes. */
export const NUMEROLOGY_PEOPLE_LIMIT = 10;

export async function listMyPeople(): Promise<PersonRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.from("numerology_people").select(PERSON_COLUMNS).order("is_self", { ascending: false }).order("created_at");
  return (data as PersonRow[] | null) ?? [];
}

export async function getMyPerson(id: string): Promise<PersonRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.from("numerology_people").select(PERSON_COLUMNS).eq("id", id).maybeSingle();
  return (data as PersonRow | null) ?? null;
}

const dateFmt = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
export const formatBirth = (iso: string) => dateFmt.format(new Date(iso + "T12:00:00Z"));

/** Nombre corto para tarjetas: el de uso o el primer nombre. */
export const shortName = (p: Pick<PersonRow, "full_name" | "current_name">) => p.current_name || p.full_name.split(/\s+/)[0];
