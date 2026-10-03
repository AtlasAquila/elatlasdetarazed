"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChartWheel } from "@/components/ChartWheel";
import { computeChart } from "@/lib/engine";
import type { Chart } from "@/lib/engine/types";

/**
 * La rueda del cielo, recalculada en directo en el navegador de quien la ve.
 * Sin casas (no dependen del lugar de cada visitante). Incluye Quirón y Lilith media.
 * No consume nada del asistente ni de la API: es el mismo motor de cálculo puro que usa /carta,
 * ejecutándose aquí en el propio dispositivo, sin llamadas al servidor mientras se mueve el tiempo.
 * La zona horaria solo afecta a cómo se muestra la fecha/hora (el instante UTC calculado es el
 * mismo, así que las posiciones no cambian); cada visitante puede elegir la suya y se recuerda
 * en su propio navegador.
 */

const SHOW = new Set(["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "chiron", "meanLilith"]);

const SPEEDS = [
  { label: "1 min/s", value: 1 / 1440 },
  { label: "1 hora/s", value: 1 / 24 },
  { label: "6 horas/s", value: 0.25 },
  { label: "1 día/s", value: 1 },
  { label: "1 semana/s", value: 7 },
  { label: "1 mes/s", value: 30 },
];

const CURATED_ZONES = [
  "UTC",
  "Europe/Madrid",
  "Europe/London",
  "Europe/Lisbon",
  "Europe/Paris",
  "Europe/Rome",
  "America/Mexico_City",
  "America/Bogota",
  "America/Lima",
  "America/Santiago",
  "America/Buenos_Aires",
  "America/Montevideo",
  "America/Caracas",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
];

function zoneLabel(id: string) {
  return id === "UTC" ? "UTC" : id.replace(/_/g, " ").replace(/\//g, " / ");
}

function chartAt(date: Date): Chart {
  return computeChart({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    timeZone: "UTC",
    latitude: 40.4168,
    longitude: -3.7038,
    houseSystem: "placidus",
  });
}

export function LiveSkyWheel() {
  const epochRef = useRef(Date.now());
  const [simDays, setSimDays] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(0.25);
  const lastFrame = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeZone, setTimeZone] = useState("UTC");

  // Al montar en el navegador: usa la zona guardada, o si no hay ninguna, la del propio dispositivo.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("aquila-rueda-tz");
      if (saved) {
        setTimeZone(saved);
        return;
      }
    } catch {
      // localStorage puede no estar disponible (modo privado, etc.); seguimos sin persistir.
    }
    try {
      const auto = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (auto) setTimeZone(auto);
    } catch {
      // si el navegador no la expone, se queda en UTC
    }
  }, []);

  const zones = useMemo(() => {
    let list: string[] = CURATED_ZONES;
    try {
      const all = (Intl as any).supportedValuesOf?.("timeZone") as string[] | undefined;
      if (all && all.length) list = Array.from(new Set(["UTC", ...all]));
    } catch {
      // el navegador no soporta supportedValuesOf; usamos la lista reducida
    }
    if (!list.includes(timeZone)) list = [timeZone, ...list];
    return list.sort();
  }, [timeZone]);

  const handleTimeZoneChange = (tz: string) => {
    setTimeZone(tz);
    try {
      window.localStorage.setItem("aquila-rueda-tz", tz);
    } catch {
      // sin persistencia si no hay localStorage
    }
  };

  useEffect(() => {
    if (!playing) {
      lastFrame.current = null;
      return;
    }
    let raf: number;
    const tick = (now: number) => {
      if (lastFrame.current != null) {
        const dt = (now - lastFrame.current) / 1000;
        setSimDays((d) => Math.max(-1825, Math.min(1825, d + dt * speed)));
      }
      lastFrame.current = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed]);

  useEffect(() => {
    const onChange = () => {
      const fsEl = document.fullscreenElement || (document as any).webkitFullscreenElement;
      setIsFullscreen(fsEl === containerRef.current);
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange as EventListener);
    };
  }, []);

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      const fsEl = document.fullscreenElement || (document as any).webkitFullscreenElement;
      if (fsEl) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
      } else {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
      }
    } catch {
      // El navegador puede negar el fullscreen; no rompemos la experiencia por ello.
    }
  };

  const date = useMemo(() => new Date(epochRef.current + simDays * 86400000), [simDays]);
  const chart = useMemo(() => chartAt(date), [date]);

  const fmtDate = useMemo(() => new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone }), [timeZone]);
  const fmtTime = useMemo(() => new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone }), [timeZone]);
  const fmtOffset = useMemo(() => new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" }), [timeZone]);
  const offsetLabel = useMemo(() => {
    try {
      const part = fmtOffset.formatToParts(date).find((p) => p.type === "timeZoneName");
      return part?.value ?? timeZone;
    } catch {
      return timeZone;
    }
  }, [fmtOffset, date, timeZone]);

  return (
    <div
      ref={containerRef}
      className="live-wheel card"
      style={{
        padding: 28,
        ...(isFullscreen
          ? {
              background: "var(--surface)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minHeight: "100vh",
              overflowY: "auto",
            }
          : {}),
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <p className="kicker" style={{ marginBottom: 20 }}>
          La rueda del cielo, en directo
        </p>
        <button
          type="button"
          className="btn btn-ghost btn-small"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Salir de pantalla completa" : "Ver en pantalla completa"}
          style={{ flexShrink: 0 }}
        >
          {isFullscreen ? "✕ Cerrar" : "⛶ Pantalla completa"}
        </button>
      </div>

      <div style={{ maxWidth: isFullscreen ? 640 : 480, width: "100%", margin: "0 auto" }}>
        <ChartWheel chart={chart} show={SHOW} hideHouses />
      </div>

      <div style={{ maxWidth: isFullscreen ? 640 : undefined, width: "100%", margin: isFullscreen ? "0 auto" : undefined }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button type="button" className="btn btn-primary btn-small" style={{ width: 42, height: 42, borderRadius: "50%", padding: 0 }} onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pausar" : "Reproducir"}>
              {playing ? "❚❚" : "▶"}
            </button>
            <span style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: 19, color: "var(--oro)", fontVariantNumeric: "tabular-nums" }}>
              {fmtDate.format(date)} · {fmtTime.format(date)} <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>{offsetLabel}</span>
            </span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-small"
            onClick={() => {
              setPlaying(false);
              setSimDays(0);
            }}
          >
            Hoy
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
          <label htmlFor="aquila-tz-select" className="small muted">
            Zona horaria:
          </label>
          <select
            id="aquila-tz-select"
            value={timeZone}
            onChange={(e) => handleTimeZoneChange(e.target.value)}
            style={{
              background: "var(--surface-raised)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: 13,
              maxWidth: 260,
            }}
          >
            {zones.map((z) => (
              <option key={z} value={z}>
                {zoneLabel(z)}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16 }}>
          <button
            type="button"
            className="btn btn-ghost btn-small"
            style={{ flexShrink: 0, width: 36, height: 36, borderRadius: "50%", padding: 0 }}
            onClick={() => {
              setPlaying(false);
              setSimDays((d) => Math.max(-1825, Math.min(1825, d - speed)));
            }}
            aria-label={`Retroceder ${SPEEDS.find((s) => s.value === speed)?.label ?? ""}`}
          >
            ◀
          </button>
          <input
            type="range"
            min={-1825}
            max={1825}
            step={0.02083333}
            value={simDays}
            onChange={(e) => {
              setPlaying(false);
              setSimDays(parseFloat(e.target.value));
            }}
            aria-label="Avanzar o retroceder en el tiempo"
            style={{ flex: 1, accentColor: "var(--oro)" }}
          />
          <button
            type="button"
            className="btn btn-ghost btn-small"
            style={{ flexShrink: 0, width: 36, height: 36, borderRadius: "50%", padding: 0 }}
            onClick={() => {
              setPlaying(false);
              setSimDays((d) => Math.max(-1825, Math.min(1825, d + speed)));
            }}
            aria-label={`Avanzar ${SPEEDS.find((s) => s.value === speed)?.label ?? ""}`}
          >
            ▶
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {SPEEDS.map((s) => (
            <button key={s.label} type="button" className="toggle" data-on={speed === s.value ? "true" : "false"} onClick={() => setSpeed(s.value)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
