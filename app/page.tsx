import { redirect } from "next/navigation";
import { isAppRequest } from "@/lib/app-mode";

export default async function HomePage() {
  // En la app, la pantalla de inicio es el clima astral.
  redirect((await isAppRequest()) ? "/clima-astral" : "/introduccion");
}
