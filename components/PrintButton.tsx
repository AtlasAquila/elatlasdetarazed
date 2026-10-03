"use client";

type Props = {
  label?: string;
};

/** Botón que abre el diálogo de impresión del navegador; desde ahí se elige "Guardar como PDF".
 * Antes de imprimir, despliega todos los <details> de la página para que su contenido salga en el PDF,
 * y los deja como estaban al terminar. */
export function PrintButton({ label = "Descargar en PDF" }: Props) {
  const handleClick = () => {
    const details = Array.from(document.querySelectorAll<HTMLDetailsElement>("details"));
    const wasOpen = details.map((d) => d.open);
    details.forEach((d) => (d.open = true));

    const restore = () => {
      details.forEach((d, i) => (d.open = wasOpen[i]));
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);

    window.print();
  };

  return (
    <button type="button" className="btn btn-ghost btn-small print-btn" onClick={handleClick}>
      ⤓ {label}
    </button>
  );
}
