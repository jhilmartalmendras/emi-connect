/**
 * Revision rapida de sintaxis de todo el codigo del frontend.
 * Uso: node revisar-sintaxis.cjs
 * Util durante el desarrollo para detectar errores de sintaxis sin compilar todo.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const RAIZ = path.join(__dirname, 'src');
let errores = 0;
let revisados = 0;

function recorrer(directorio) {
  fs.readdirSync(directorio, { withFileTypes: true }).forEach((entrada) => {
    const ruta = path.join(directorio, entrada.name);

    if (entrada.isDirectory()) {
      recorrer(ruta);
      return;
    }

    if (!/\.(js|jsx)$/.test(entrada.name)) return;

    revisados += 1;
    const codigo = fs.readFileSync(ruta, 'utf8');
    const cargador = entrada.name.endsWith('.jsx') ? 'jsx' : 'js';

    try {
      esbuild.transformSync(codigo, { loader: cargador, format: 'esm' });
    } catch (error) {
      errores += 1;
      console.log(`ERROR EN ${path.relative(__dirname, ruta)}`);
      (error.errors || []).forEach((detalle) => {
        console.log(`   linea ${detalle.location?.line || '?'}: ${detalle.text}`);
      });
    }
  });
}

recorrer(RAIZ);
console.log(`Archivos revisados: ${revisados} | Errores de sintaxis: ${errores}`);
process.exit(errores > 0 ? 1 : 0);
