const fs = require('fs');
const path = require('path');
const { variablesEntorno } = require('../config/variablesEntorno');
const { ErrorAplicacion } = require('../utilidades/ErrorAplicacion');

// Carpetas permitidas para la subida de archivos.
const CARPETAS_PERMITIDAS = ['perfiles', 'publicaciones', 'comunidades', 'eventos', 'productos'];

/**
 * Servicio de archivos.
 * Centraliza la resolucion de rutas y el borrado seguro de imagenes subidas.
 */
const servicioArchivo = {
  CARPETAS_PERMITIDAS,

  /** Valida que la carpeta destino sea una de las permitidas. */
  validarCarpeta(carpeta) {
    if (!CARPETAS_PERMITIDAS.includes(carpeta)) {
      throw ErrorAplicacion.solicitudInvalida('La carpeta de destino del archivo no es valida.');
    }
    return carpeta;
  },

  /** Construye la ruta publica del archivo (la que guarda MongoDB). */
  construirRutaPublica(carpeta, nombreArchivo) {
    return `/uploads/${carpeta}/${nombreArchivo}`;
  },

  /** Convierte una ruta publica en ruta absoluta del disco, evitando salir de uploads. */
  resolverRutaAbsoluta(rutaPublica) {
    if (!rutaPublica || !rutaPublica.startsWith('/uploads/')) {
      throw ErrorAplicacion.solicitudInvalida('La ruta del archivo no es valida.');
    }

    const relativa = rutaPublica.replace('/uploads/', '');
    const absoluta = path.join(variablesEntorno.archivos.carpetaBase, relativa);
    const baseNormalizada = path.resolve(variablesEntorno.archivos.carpetaBase);
    const absolutaNormalizada = path.resolve(absoluta);

    // Proteccion contra path traversal (por ejemplo "/uploads/../../etc/passwd").
    if (!absolutaNormalizada.startsWith(baseNormalizada)) {
      throw ErrorAplicacion.prohibido('La ruta del archivo no es valida.');
    }

    return absolutaNormalizada;
  },

  /** Elimina un archivo subido si existe. */
  eliminar(rutaPublica) {
    try {
      const absoluta = this.resolverRutaAbsoluta(rutaPublica);
      if (fs.existsSync(absoluta)) {
        fs.unlinkSync(absoluta);
        return true;
      }
      return false;
    } catch (error) {
      console.warn('[archivos] No se pudo eliminar el archivo:', error.message);
      return false;
    }
  },

  /** Elimina varios archivos de una vez. */
  eliminarVarios(rutas = []) {
    rutas.filter(Boolean).forEach((ruta) => this.eliminar(ruta));
  },
};

module.exports = { servicioArchivo };
