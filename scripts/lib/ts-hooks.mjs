/**
 * Ganchos de carga para ejecutar el TypeScript del proyecto con Node, sin tsx ni dependencias:
 * resuelve el alias «@/» a la raíz de la web, añade la extensión «.ts» a las importaciones sin
 * extensión y sirve los .json como módulos. Lo usan las pruebas (`npm test`) y los scripts.
 * Uso: node --experimental-transform-types --import ./scripts/lib/register.mjs <archivo.ts>
 */
import { readFileSync, statSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), "../..");

const isFile = (p) => {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
};

export async function resolve(specifier, context, next) {
  let base = null;
  if (specifier.startsWith("@/")) base = resolvePath(ROOT, specifier.slice(2));
  else if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    base = resolvePath(dirname(fileURLToPath(context.parentURL)), specifier);
  }
  if (base) {
    const file = [base, `${base}.ts`, `${base}.tsx`, resolvePath(base, "index.ts")].find(isFile);
    if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.startsWith("file:") && url.endsWith(".json")) {
    const source = readFileSync(fileURLToPath(url), "utf8");
    return { format: "module", source: `export default ${source};`, shortCircuit: true };
  }
  return next(url, context);
}
