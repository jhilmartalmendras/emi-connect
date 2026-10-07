const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const { rutasApi } = require('../rutas');
const { manejadorErrores, rutaNoEncontrada } = require('../middlewares/errores');
const { limitadorGlobal } = require('../middlewares/limitadores');
const { variablesEntorno } = require('../config/variablesEntorno');
const { configuracionInstitucional } = require('../config/institucional');

/**
 * Construye la aplicacion Express de EMI Connect.
 * Se exporta como funcion para poder reutilizarla en las pruebas.
 */
function crearAplicacion() {
  const aplicacion = express();

  // Detras de un proxy (nginx, IIS) se necesita para que el rate limit funcione bien.
  aplicacion.set('trust proxy', 1);

  // ------------------------------------------------------------ Seguridad
  aplicacion.use(
    helmet({
      // Se permite cargar imagenes propias (uploads) y recursos del mismo origen.
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'blob:', variablesEntorno.frontendUrl],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: ["'self'", variablesEntorno.frontendUrl],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: variablesEntorno.esProduccion,
    })
  );

  // CORS: solo se permite el frontend configurado y localhost en desarrollo.
  const origenesPermitidos = [
    variablesEntorno.frontendUrl,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
  ].filter(Boolean);

  aplicacion.use(
    cors({
      origin(origen, callback) {
        // Sin origin (Postman, pruebas, apps moviles) se permite.
        if (!origen) return callback(null, true);
        if (origenesPermitidos.includes(origen)) return callback(null, true);
        return callback(new Error('El origen de la peticion no esta permitido por CORS.'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400,
    })
  );

  // ------------------------------------------------------------ Parsers
  aplicacion.use(express.json({ limit: '2mb' }));
  aplicacion.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // ------------------------------------------------------------ Registro de peticiones
  if (!variablesEntorno.esProduccion) {
    aplicacion.use(morgan('[:method] :url :status - :response-time ms'));
  } else {
    aplicacion.use(morgan('combined'));
  }

  // ------------------------------------------------------------ Archivos subidos
  // Se sirven solo imagenes validadas, sin listado de directorios y sin dotfiles.
  aplicacion.use(
    '/uploads',
    express.static(variablesEntorno.archivos.carpetaBase, {
      index: false,
      dotfiles: 'deny',
      maxAge: '7d',
      setHeaders(respuesta) {
        respuesta.setHeader('X-Content-Type-Options', 'nosniff');
        respuesta.setHeader('Cache-Control', 'public, max-age=604800');
      },
    })
  );

  // ------------------------------------------------------------ Rutas
  aplicacion.get('/api/salud', (req, res) => {
    res.status(200).json({
      exito: true,
      mensaje: 'El servicio de EMI Connect esta activo.',
      datos: {
        plataforma: configuracionInstitucional.nombrePlataforma,
        institucion: configuracionInstitucional.nombreInstitucion,
        entorno: variablesEntorno.entorno,
        fecha: new Date().toISOString(),
      },
    });
  });

  aplicacion.use('/api', limitadorGlobal, rutasApi);

  // ------------------------------------------------------------ Manejo de errores
  aplicacion.use(rutaNoEncontrada);
  aplicacion.use(manejadorErrores);

  return aplicacion;
}

module.exports = { crearAplicacion };
