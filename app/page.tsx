import { redirect } from "next/navigation";
import { AppHome } from "@/components/AppHome";
import { isAppRequest } from "@/lib/app-mode";
import { countUnreadReportes } from "@/lib/reportes";

export default async function HomePage() {
  // En la app, la pantalla de inicio son las seis secciones sobre el águila.
  if (await isAppRequest()) return <AppHome unread={await countUnreadReportes()} />;
  redirect("/introduccion");
}
