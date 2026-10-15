"use client";

import { useEffect, useState, useTransition } from "react";
import { registerDevice, sendTestPush, unregisterDevice, updateAvisos } from "@/app/actions/avisos";
import { nativeBridge, registerForPush, storeToken, storedToken } from "@/lib/native";

type Props = {
  initial: { daily: boolean; weekly: boolean; alerts: boolean; chartId: string | null };
  charts: { id: string; name: string }[];
};

/** Panel de la pestaña Cuenta (solo en la app): activar los avisos y elegir cuáles recibir. */
export function AppAvisos({ initial, charts }: Props) {
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [daily, setDaily] = useState(initial.daily);
  const [weekly, setWeekly] = useState(initial.weekly);
  const [alerts, setAlerts] = useState(initial.alerts);
  const [chartId, setChartId] = useState(initial.chartId ?? charts[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    setReady(nativeBridge() !== null);
    setEnabled(storedToken() !== null);
  }, []);

  if (!ready) return null;

  const activate = () => {
    setMessage(null);
    start(async () => {
      let done = false;
      const result = await registerForPush(async (token) => {
        const saved = await registerDevice(token);
        if (saved.ok) {
          storeToken(token);
          setEnabled(true);
          done = true;
        } else setMessage(saved.error ?? "No se ha podido activar el aviso.");
      });
      if (result === "denied") setMessage("Android tiene bloqueados los avisos de esta app. Actívalos en Ajustes → Aplicaciones → Códice Orbital → Notificaciones.");
      else if (result === "unavailable" && !done) setMessage("No se han podido activar los avisos en este dispositivo.");
    });
  };

  const deactivate = () => {
    const token = storedToken();
    start(async () => {
      if (token) await unregisterDevice(token);
      storeToken(null);
      setEnabled(false);
      setMessage(null);
    });
  };

  const save = (next: { daily: boolean; weekly: boolean; alerts: boolean; chartId: string }) => {
    setDaily(next.daily);
    setWeekly(next.weekly);
    setAlerts(next.alerts);
    setChartId(next.chartId);
    start(async () => {
      const result = await updateAvisos({ daily: next.daily, weekly: next.weekly, alerts: next.alerts, chartId: next.chartId || null });
      setMessage(result.ok ? "Guardado." : (result.error ?? "No se ha podido guardar."));
    });
  };

  const test = () => {
    setMessage(null);
    start(async () => {
      const result = await sendTestPush();
      setMessage(result.ok ? "Te lo envío en 10 segundos. Sal de la app (botón de inicio) o bloquea el móvil para verlo en las notificaciones." : (result.error ?? "No se ha podido enviar."));
    });
  };

  return (
    <div className="panel" style={{ marginTop: 24 }}>
      <h3>Avisos</h3>
      {!enabled ? (
        <>
          <p className="muted">Recibe en el móvil el clima astral de cada día y de cada semana y un aviso cuando llegue algo importante a tu carta.</p>
          <button type="button" className="btn btn-primary btn-small" onClick={activate} disabled={pending}>
            {pending ? "Activando…" : "Activar avisos"}
          </button>
        </>
      ) : (
        <>
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 16 }}>
            <input type="checkbox" checked={daily} disabled={pending} onChange={(e) => save({ daily: e.target.checked, weekly, alerts, chartId })} style={{ marginTop: 6 }} />
            <span>
              <strong>Clima astral del día</strong>
              <br />
              <span className="small muted">Cada mañana, hacia las 8:00 de España.</span>
            </span>
          </label>
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 16 }}>
            <input type="checkbox" checked={weekly} disabled={pending} onChange={(e) => save({ daily, weekly: e.target.checked, alerts, chartId })} style={{ marginTop: 6 }} />
            <span>
              <strong>Clima astral de la semana</strong>
              <br />
              <span className="small muted">El día que se publica, por la mañana.</span>
            </span>
          </label>
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 16 }}>
            <input type="checkbox" checked={alerts} disabled={pending || charts.length === 0} onChange={(e) => save({ daily, weekly, alerts: e.target.checked, chartId })} style={{ marginTop: 6 }} />
            <span>
              <strong>Lunaciones y tránsitos importantes sobre tu carta</strong>
              <br />
              <span className="small muted">{charts.length === 0 ? "Crea tu carta natal para recibirlos." : "Un aviso el día antes o el mismo día, como máximo uno diario."}</span>
            </span>
          </label>
          {alerts && charts.length > 1 && (
            <div className="field" style={{ marginBottom: 16 }}>
              <label htmlFor="carta-avisos">Carta para los avisos</label>
              <select id="carta-avisos" className="input" value={chartId} disabled={pending} onChange={(e) => save({ daily, weekly, alerts, chartId: e.target.value })}>
                {charts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="actions">
            <button type="button" className="btn btn-ghost btn-small" onClick={test} disabled={pending}>
              Enviarme un aviso de prueba
            </button>
            <button type="button" className="btn btn-ghost btn-small" onClick={deactivate} disabled={pending}>
              Desactivar avisos
            </button>
          </div>
        </>
      )}
      {message && (
        <p className="small muted" role="status" style={{ marginTop: 12, marginBottom: 0 }}>
          {message}
        </p>
      )}
    </div>
  );
}
