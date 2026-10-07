const path = require('path');
const dotenv = require('dotenv');

// Se carga el archivo .env una sola vez para todo el backend.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function convertirBooleano(valor, porDefecto = false) {
  if (valor === undefined || valor === null || valor === '') return porDefecto;
  return ['true', '1', 'si', 'sí', 'yes'].includes(String(valor).toLowerCase());
}

function convertirNumero(valor, porDefecto) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : porDefecto;
}

const variablesEntorno = {
  entorno: process.env.ENTORNO || 'desarrollo',
  esProduccion: process.env.ENTORNO === 'produccion',

  puerto: convertirNumero(process.env.PUERTO, 4000),

  baseDatos: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/emi_connect',
  },

  jwt: {
    secreto: process.env.JWT_SECRETO || 'secreto_de_desarrollo_no_usar_en_produccion',
    expiracion: process.env.JWT_EXPIRACION || '7d',
  },

  // Dominio institucional unico autorizado para registrar cuentas.
  dominioInstitucional: (process.env.DOMINIO_INSTITUCIONAL || '@est.emi.edu.bo').toLowerCase(),

  // Configuracion UNICA del correo emisor. Cambiarla aqui afecta a todo el sistema.
  correo: {
    emisor: process.env.CORREO_EMISOR || 'dtorricof@est.emi.edu.bo',
    contrasena: process.env.CORREO_CONTRASENA || '',
    host: process.env.CORREO_HOST || 'smtp.gmail.com',
    puerto: convertirNumero(process.env.CORREO_PUERTO, 587),
    seguridad: convertirBooleano(process.env.CORREO_SEGURIDAD, true),
    nombreEmisor: process.env.CORREO_NOMBRE || 'EMI Connect',
    modoDesarrollo: convertirBooleano(process.env.CORREO_MODO_DESARROLLO, false),
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  archivos: {
    tamanoMaximoBytes: convertirNumero(process.env.ARCHIVO_TAMANO_MAXIMO_MB, 8) * 1024 * 1024,
    carpetaBase: path.resolve(__dirname, '../../uploads'),
  },
};

/**
 * Verifica la configuracion critica y avisa por consola cuando algo falta.
 * No detiene el servidor en desarrollo para facilitar las pruebas locales.
 */
function validarVariablesEntorno() {
  const advertencias = [];

  if (!process.env.JWT_SECRETO) {
    advertencias.push('JWT_SECRETO no esta definido: se usa un valor de desarrollo.');
  }
  if (!variablesEntorno.correo.contrasena) {
    advertencias.push(
      'CORREO_CONTRASENA no esta definida: los codigos de verificacion se mostraran en consola.'
    );
  }

  if (advertencias.length > 0) {
    console.warn('[configuracion] Advertencias:');
    advertencias.forEach((texto) => console.warn('  -', texto));
  }

  if (variablesEntorno.esProduccion) {
    if (!process.env.JWT_SECRETO || process.env.JWT_SECRETO.length < 24) {
      throw new Error('JWT_SECRETO es obligatorio y debe tener al menos 24 caracteres en produccion.');
    }
    if (!variablesEntorno.correo.contrasena) {
      throw new Error('CORREO_CONTRASENA es obligatoria en produccion.');
    }
  }
}

module.exports = { variablesEntorno, validarVariablesEntorno };
