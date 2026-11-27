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
  titulo: "De la Luna llena en Géminis a la Luna llena en Cáncer",
  periodo: "24 de noviembre – 24 de diciembre de 2026",
  lunas: [
    { fecha: "24 nov", signo: "Géminis", fase: "llena" },
    { fecha: "9 dic", signo: "Sagitario", fase: "nueva" },
    { fecha: "24 dic", signo: "Cáncer", fase: "llena" },
  ],
  activos: ["♄︎ Saturno directo el 10 dic", "♆︎ Neptuno directo el 12 dic", "♃︎ Júpiter retrógrado desde el 13 dic", "♅︎ Urano retrógrado hasta el 8 feb"],
  eventos: [
    { utc: "2026-11-24T14:54Z", glifo: "☾", titulo: "Luna llena en Géminis", grado: "2°20'", tipo: "lunacion", texto: "Se abre el ciclo con la Luna junto a Urano. Una noticia, una idea o un cambio de planes deja ver lo que ya no cabe en la rutina." },
    { utc: "2026-11-25T22:41Z", glifo: "☉", titulo: "Sol en oposición a Urano", grado: "3°41' Sagitario", tipo: "clave", texto: "El aspecto que más pesa del ciclo. Las certezas se mueven: conviene dejar sitio a lo imprevisto en lugar de agarrarse al guion." },
    { utc: "2026-11-25T23:37Z", glifo: "♂", titulo: "Marte entra en Virgo", texto: "La fuerza se vuelve oficio: menos gesto y más método. En enero se volverá retrógrado y regresará a Leo, así que lo que empiece ahora es un ensayo." },
    { utc: "2026-11-29T00:05Z", glifo: "♀", titulo: "Venus en oposición a Quirón", texto: "Una herida antigua en la manera de dar y recibir afecto pide cuidado, no juicio." },
    { utc: "2026-11-29T11:26Z", glifo: "♅", titulo: "Urano en trígono a Plutón", grado: "3°32' Géminis", tipo: "clave", texto: "Dos planetas lentos del cambio colectivo se dan la mano: lo nuevo y lo que se transforma de raíz encuentran un mismo cauce." },
    { utc: "2026-11-30T06:06Z", glifo: "☉", titulo: "Sol en trígono a Saturno", texto: "Fe con forma. Un buen momento para comprometerse con lo que de verdad importa." },
    { utc: "2026-12-04T08:13Z", glifo: "♀", titulo: "Venus vuelve a Escorpio", texto: "Tras el retrógrado, Venus regresa al signo donde empezó a mirar hacia dentro. El deseo, ya comprendido, puede vivirse con más verdad." },
    { utc: "2026-12-04T19:28Z", glifo: "♂", titulo: "Marte en cuadratura a Urano", texto: "Impulsos repentinos y planes que se tuercen. Flexibilidad antes que fuerza." },
    { utc: "2026-12-06T08:33Z", glifo: "☿", titulo: "Mercurio entra en Sagitario", texto: "La mente sale de la cueva y busca horizonte. Dos días después, en oposición a Urano, llegan ideas de golpe: escucha antes de contestar." },
    { utc: "2026-12-09T00:52Z", glifo: "●", titulo: "Luna nueva en Sagitario", grado: "16°57'", tipo: "lunacion", texto: "Siembra de sentido: una intención sobre aquello en lo que quieres creer y hacia dónde quieres crecer." },
    { utc: "2026-12-09T18:38Z", glifo: "♀", titulo: "Venus en cuadratura a Plutón", texto: "Tercer y último paso de esta cuadratura, tras los de septiembre y octubre. Lo que se removió en los vínculos puede cerrarse con honestidad." },
    { utc: "2026-12-10T23:31Z", glifo: "♄", titulo: "Saturno directo", grado: "7°56' Aries", tipo: "clave", texto: "Tras meses de revisión, los compromisos y las estructuras vuelven a avanzar. Lo que se ha consolidado ya puede construirse." },
    { utc: "2026-12-12T22:17Z", glifo: "♆", titulo: "Neptuno directo", grado: "1°37' Aries", tipo: "clave", texto: "La niebla empieza a levantarse: los sueños y las intuiciones de estos meses buscan una forma en el mundo." },
    { utc: "2026-12-13T00:57Z", glifo: "♃", titulo: "Júpiter retrógrado", grado: "27°01' Leo", tipo: "clave", texto: "La expansión se vuelve interior: revisar en qué confías y qué quieres hacer crecer de verdad. Hasta el 13 de abril." },
    { utc: "2026-12-18T21:21Z", glifo: "☉", titulo: "Sol en trígono a Júpiter", texto: "El mismo día, también en trígono a Quirón. Confianza y generosidad: un buen día para celebrar lo aprendido." },
    { utc: "2026-12-21T20:50Z", glifo: "☉", titulo: "El Sol entra en Capricornio", texto: "Solsticio de invierno en el hemisferio norte: la noche más larga y, desde ella, el regreso de la luz." },
    { utc: "2026-12-24T01:28Z", glifo: "☾", titulo: "Luna llena en Cáncer", grado: "2°14'", tipo: "lunacion", texto: "Cierre del ciclo a las puertas de la Navidad, con la Luna en su domicilio y en cuadratura a Neptuno. Cuidar más que idealizar." },
  ],
};
