"use client";

import { useState } from "react";

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const pad = (n: number) => String(n).padStart(2, "0");
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/**
 * Fecha y hora de nacimiento con desplegables en vez de `type="date"` y `type="time"`.
 * Los selectores nativos se bloquean en el navegador interno de Instagram, así que se
 * envían igualmente `date` (AAAA-MM-DD) y `time` (HH:MM) en campos ocultos.
 */
export function BirthDateTimeFields({ idPrefix }: { idPrefix: string }) {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");

  const thisYear = new Date().getFullYear();
  const daysInMonth = month && year ? new Date(Number(year), Number(month), 0).getDate() : month ? new Date(2000, Number(month), 0).getDate() : 31;
  const dayValue = day && Number(day) > daysInMonth ? "" : day;

  const date = dayValue && month && year ? `${year}-${pad(Number(month))}-${pad(Number(dayValue))}` : "";
  const time = hour !== "" && minute !== "" ? `${pad(Number(hour))}:${pad(Number(minute))}` : "";

  return (
    <div className="grid-2 birth-selects" style={{ gap: 20 }}>
      <div className="field">
        <label htmlFor={`${idPrefix}-day`}>Fecha de nacimiento</label>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.5fr) minmax(0, 1.2fr)", gap: 8 }}>
          <select id={`${idPrefix}-day`} className="input" required value={dayValue} onChange={(e) => setDay(e.target.value)} aria-label="Día">
            <option value="">Día</option>
            {range(1, daysInMonth).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select className="input" required value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Mes">
            <option value="">Mes</option>
            {MESES.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select className="input" required value={year} onChange={(e) => setYear(e.target.value)} aria-label="Año">
            <option value="">Año</option>
            {range(1900, thisYear)
              .reverse()
              .map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
          </select>
        </div>
        <input type="hidden" name="date" value={date} />
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}-hour`}>Hora de nacimiento</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
          <select id={`${idPrefix}-hour`} className="input" required value={hour} onChange={(e) => setHour(e.target.value)} aria-label="Hora">
            <option value="">Hora</option>
            {range(0, 23).map((h) => (
              <option key={h} value={h}>
                {pad(h)}
              </option>
            ))}
          </select>
          <select className="input" required value={minute} onChange={(e) => setMinute(e.target.value)} aria-label="Minutos">
            <option value="">Min.</option>
            {range(0, 59).map((m) => (
              <option key={m} value={m}>
                {pad(m)}
              </option>
            ))}
          </select>
        </div>
        <input type="hidden" name="time" value={time} />
        <span className="small muted">Formato de 24 horas (las 5 de la tarde son las 17).</span>
      </div>
    </div>
  );
}
