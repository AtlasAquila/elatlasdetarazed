"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { markReportesRead } from "@/app/actions/reportes";

/** Al abrir la lista, marca los reportes como leídos y refresca el punto de la pestaña. */
export function ReportesMarkRead({ unread }: { unread: number }) {
  const router = useRouter();
  useEffect(() => {
    if (unread === 0) return;
    markReportesRead().then(() => router.refresh());
  }, [unread, router]);
  return null;
}
