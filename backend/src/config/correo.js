const nodemailer = require('nodemailer');
const { variablesEntorno } = require('./variablesEntorno');

/**
 * Configuracion UNICA del transporte de correo.
 *
 * Toda la plataforma (verificacion, recuperacion de contrasena y notificaciones
 * importantes) utiliza este mismo transporte. Para cambiar la cuenta emisora
 * unicamente se modifica CORREO_EMISOR en el archivo .env.
 */
let transporte = null;

function obtenerTransporte() {
  if (transporte) return transporte;

  const { correo } = variablesEntorno;

  // Modo desarrollo sin credenciales: el correo no se envia realmente,
  // se registra en consola para poder probar el flujo completo.
  if (!correo.contrasena || correo.modoDesarrollo) {
    transporte = nodemailer.createTransport({ jsonTransport: true });
    return transporte;
  }

  transporte = nodemailer.createTransport({
    host: correo.host,
    port: correo.puerto,
    secure: correo.puerto === 465, // 465 usa SSL directo, 587 usa STARTTLS
    requireTLS: correo.seguridad && correo.puerto !== 465,
    auth: {
      user: correo.emisor,
      pass: correo.contrasena,
    },
    tls: {
      // Evita fallos con certificados institucionales en equipos Windows antiguos.
      rejectUnauthorized: false,
    },
  });

  return transporte;
}

function correoEstaConfigurado() {
  return Boolean(variablesEntorno.correo.contrasena) && !variablesEntorno.correo.modoDesarrollo;
}

/**
 * Envia un correo usando el emisor institucional configurado.
 * @param {{ destino: string, asunto: string, html: string, texto?: string }} opciones
 */
async function enviarCorreo({ destino, asunto, html, texto }) {
  const { correo } = variablesEntorno;

  const opciones = {
    from: `"${correo.nombreEmisor}" <${correo.emisor}>`,
    to: destino,
    subject: asunto,
    html,
    text: texto || undefined,
  };

  try {
    const resultado = await obtenerTransporte().sendMail(opciones);
    if (resultado.message && !correoEstaConfigurado()) {
      console.log(`[correo] (modo desarrollo) Correo simulado para ${destino}: ${asunto}`);
    }
    return { enviado: true, simulado: !correoEstaConfigurado() };
  } catch (error) {
    console.error(`[correo] No se pudo enviar el correo a ${destino}:`, error.message);
    // El sistema no debe caer si el SMTP falla: se devuelve el error al servicio.
    return { enviado: false, error: error.message };
  }
}

module.exports = { enviarCorreo, correoEstaConfigurado, obtenerTransporte };
