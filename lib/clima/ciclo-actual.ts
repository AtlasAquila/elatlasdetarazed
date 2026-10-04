/**
 * Ciclo lunar que se muestra en /clima-astral, de Luna llena a Luna llena.
 * Fechas, horas (UTC) y grados calculados con lib/engine. Se renueva en cada Luna llena.
 */

export type EventoCiclo = {
  /** Instante exacto en UTC (ISO). */
  utc: string;
  glifo: string;
  titulo: string;
  grado?: string;
  texto: string;
  tipo?: "lunacion" | "clave";
};

export type CicloLunar = {
  titulo: string;
  periodo: string;
  lunas: { fecha: string; signo: string; fase: "llena" | "nueva" }[];
  activos: string[];
  eventos: EventoCiclo[];
};

export const CICLO_ACTUAL: CicloLunar = {
  titulo: "De la Luna llena en Aries a la Luna llena en Tauro",
  periodo: "26 de septiembre – 26 de octubre de 2026",
  lunas: [
    { fecha: "26 sep", signo: "Aries", fase: "llena" },
    { fecha: "10 oct", signo: "Libra", fase: "nueva" },
    { fecha: "26 oct", signo: "Tauro", fase: "llena" },
  ],
  activos: ["♀︎ Venus retrógrado desde el 3 oct", "☿︎ Mercurio retrógrado desde el 24 oct", "♇︎ Plutón directo el 16 oct"],
  eventos: [
    { utc: "2026-09-26T16:49Z", glifo: "☾", titulo: "Luna llena en Aries", grado: "3°37'", tipo: "lunacion", texto: "Se abre el ciclo. Lo que se ha encendido pide valentía para mostrarse sin pedir permiso." },
    { utc: "2026-09-28T02:49Z", glifo: "♂", titulo: "Marte entra en Leo", texto: "El fuego vuelve al corazón: la acción se alinea con lo que de verdad te hace sentir vivo." },
    { utc: "2026-09-30T11:44Z", glifo: "☿", titulo: "Mercurio entra en Escorpio", texto: "La mente baja a lo profundo. Las palabras buscan verdad, no comodidad." },
    { utc: "2026-10-02T20:43Z", glifo: "☿", titulo: "Mercurio en cuadratura a Plutón", texto: "Conversaciones que remueven. Algo oculto sale a la luz para poder transformarse." },
    { utc: "2026-10-03T07:10Z", glifo: "♀", titulo: "Venus retrógrado", grado: "8°29' Escorpio", tipo: "clave", texto: "Empieza un viaje hacia dentro del amor y del deseo. Lo que creías cerrado vuelve para ser comprendido. Hasta el 14 de noviembre." },
    { utc: "2026-10-10T15:50Z", glifo: "●", titulo: "Luna nueva en Libra", grado: "17°22'", tipo: "lunacion", texto: "Siembra de equilibrio: una intención sobre cómo quieres vincularte y cómo quieres cuidarte." },
    { utc: "2026-10-10T21:22Z", glifo: "♀", titulo: "Venus retrógrado en cuadratura a Marte", texto: "Tensión entre lo que deseas y la forma en que lo persigues. Respira antes de reaccionar." },
    { utc: "2026-10-15T08:22Z", glifo: "☉", titulo: "Sol en sextil a Júpiter", texto: "Una ventana de confianza y de fe en el camino. Un buen día para abrir puertas." },
    { utc: "2026-10-16T02:25Z", glifo: "♇", titulo: "Plutón directo", grado: "3°04' Acuario", tipo: "clave", texto: "Tras meses de revisión interior, la transformación profunda vuelve a avanzar hacia fuera." },
    { utc: "2026-10-16T08:26Z", glifo: "♂", titulo: "Marte en trígono a Saturno", texto: "Fuerza con estructura: el esfuerzo sostenido empieza a dar frutos reales." },
    { utc: "2026-10-20T06:43Z", glifo: "♀", titulo: "Venus retrógrado en cuadratura a Plutón", texto: "Apegos, celos y heridas antiguas piden ser mirados de frente, no escondidos." },
    { utc: "2026-10-23T09:39Z", glifo: "☉", titulo: "El Sol entra en Escorpio", texto: "Comienza la temporada de la profundidad: morir a lo viejo para renacer." },
    { utc: "2026-10-24T07:12Z", glifo: "☿", titulo: "Mercurio retrógrado", grado: "20°58' Escorpio", tipo: "clave", texto: "Tiempo de revisar, releer y recordar antes de decidir. Hasta el 13 de noviembre." },
    { utc: "2026-10-25T08:57Z", glifo: "♀", titulo: "Venus retrógrado regresa a Libra", texto: "El corazón vuelve a revisar acuerdos, promesas y la justicia en los vínculos." },
    { utc: "2026-10-26T04:12Z", glifo: "☾", titulo: "Luna llena en Tauro", grado: "2°45'", tipo: "lunacion", texto: "Cierre del ciclo, en tensión con Plutón. Soltar aquello a lo que te aferras por miedo a perderlo." },
  ],
};
