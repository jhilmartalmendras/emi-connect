const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { variablesEntorno } = require('../config/variablesEntorno');
const { ErrorAplicacion } = require('../utilidades/ErrorAplicacion');
const { generarIdentificadorUnico, normalizarNombreArchivo } = require('../utilidades/identificadores');

// Tipos MIME permitidos (solo imagenes).
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Extensiones permitidas como segunda verificacion.
const EXTENSIONES_PERMITIDAS = ['.jpg', '.jpeg', '.png', '.webp'];

// Firmas binarias (magic numbers) para validar el contenido real del archivo.
const FIRMAS = [
  { tipo: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { tipo: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { tipo: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF" (WebP)
];

/** Verifica la firma binaria del archivo para confirmar que es una imagen real. */
function firmaValida(rutaArchivo) {
  try {
    const descriptor = fs.openSync(rutaArchivo, 'r');
    const buffer = Buffer.alloc(8);
    fs.readSync(descriptor, buffer, 0, 8, 0);
    fs.closeSync(descriptor);

    return FIRMAS.some((firma) => firma.bytes.every((byte, indice) => buffer[indice] === byte));
  } catch (error) {
    return false;
  }
}

/** Asegura que la carpeta de destino exista antes de guardar. */
function asegurarCarpeta(carpeta) {
  if (!fs.existsSync(carpeta)) fs.mkdirSync(carpeta, { recursive: true });
}

/**
 * Crea un middleware de subida para una carpeta especifica de uploads.
 * @param {string} carpeta perfiles | publicaciones | comunidades | eventos | productos
 * @param {{ maximo?: number, campo?: string }} opciones
 */
function crearSubida(carpeta, { maximo = 1, campo = 'archivo' } = {}) {
  asegurarCarpeta(path.join(variablesEntorno.archivos.carpetaBase, carpeta));

  const almacenamiento = multer.diskStorage({
    destination(req, archivo, callback) {
      callback(null, path.join(variablesEntorno.archivos.carpetaBase, carpeta));
    },
    filename(req, archivo, callback) {
      const extension = path.extname(archivo.originalname || '').toLowerCase();
      const extensionFinal = EXTENSIONES_PERMITIDAS.includes(extension) ? extension : '.jpg';
      const nombreBase = normalizarNombreArchivo(path.basename(archivo.originalname || 'imagen', extension));
      const nombreFinal = `${Date.now()}_${generarIdentificadorUnico()}_${nombreBase}${extensionFinal}`;
      callback(null, nombreFinal.slice(0, 120));
    },
  });

  const filtroArchivos = (req, archivo, callback) => {
    const tipoValido = TIPOS_PERMITIDOS.includes(archivo.mimetype);
    const extension = path.extname(archivo.originalname || '').toLowerCase();
    const extensionValida = EXTENSIONES_PERMITIDAS.includes(extension);

    if (!tipoValido || !extensionValida) {
      return callback(
        ErrorAplicacion.solicitudInvalida('Formato no permitido. Solo se aceptan imagenes jpg, jpeg, png o webp.')
      );
    }
    return callback(null, true);
  };

  const subida = multer({
    storage: almacenamiento,
    limits: {
      fileSize: variablesEntorno.archivos.tamanoMaximoBytes,
      files: maximo,
    },
    fileFilter: filtroArchivos,
  });

  return maximo > 1 ? subida.array(campo, maximo) : subida.single(campo);
}

/**
 * Middleware que valida la firma binaria de los archivos ya guardados.
 * Se ejecuta despues de multer y elimina el archivo si no es una imagen real.
 */
function validarFirmaArchivos(carpeta) {
  return function verificarFirma(req, res, next) {
    const archivos = req.files
      ? Array.isArray(req.files)
        ? req.files
        : Object.values(req.files).flat()
      : req.file
      ? [req.file]
      : [];

    if (archivos.length === 0) return next();

    const invalidos = archivos.filter((archivo) => !firmaValida(archivo.path));

    if (invalidos.length > 0) {
      // Se eliminan los archivos invalidos antes de responder con error.
      invalidos.forEach((archivo) => {
        try {
          fs.unlinkSync(archivo.path);
        } catch (error) {
          console.warn('[archivos] No se pudo limpiar el archivo invalido:', error.message);
        }
      });
      return next(
        ErrorAplicacion.solicitudInvalida('El archivo enviado no es una imagen valida.')
      );
    }

    return next();
  };
}

/** Convierte el archivo subido en su ruta publica (/uploads/...). */
function rutaPublicaDe(carpeta, archivo) {
  if (!archivo) return '';
  return `/uploads/${carpeta}/${archivo.filename}`;
}

module.exports = { crearSubida, validarFirmaArchivos, rutaPublicaDe, TIPOS_PERMITIDOS };
