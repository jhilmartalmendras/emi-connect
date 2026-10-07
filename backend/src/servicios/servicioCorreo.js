const { enviarCorreo, correoEstaConfigurado } = require('../config/correo');
const { variablesEntorno } = require('../config/variablesEntorno');
const { configuracionInstitucional } = require('../config/institucional');

/**
 * Servicio de correo de EMI Connect.
 * Unico punto de envio de correos: verificacion, recuperacion y avisos.
 * La cuenta emisora se toma siempre de variables de entorno (CORREO_EMISOR).
 */

/** Plantilla base con la identidad visual de EMI Connect. */
function plantillaBase({ titulo, contenidoHtml }) {
  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${titulo}</title>
  </head>
  <body style="margin:0;padding:0;background:#eef4fb;font-family:'Segoe UI',Arial,sans-serif;color:#102c52;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef4fb;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(11,32,57,0.10);">
            <tr>
              <td style="background:#0b2039;padding:24px 28px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">
                      EMI <span style="color:#d4a017;">Connect</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size:12px;color:#b0cbea;padding-top:4px;">
                      ${configuracionInstitucional.nombreInstitucion}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 16px;font-size:20px;color:#0b2039;">${titulo}</h1>
                ${contenidoHtml}
              </td>
            </tr>
            <tr>
              <td style="background:#f4f7fb;padding:18px 28px;font-size:12px;color:#5a6b80;border-top:1px solid #e2e9f2;">
                Este mensaje fue enviado automaticamente por ${configuracionInstitucional.nombrePlataforma}.
                Si no solicitaste esta accion, puedes ignorar el correo.
                <br /><br />
                Correo emisor configurado: <strong>${variablesEntorno.correo.emisor}</strong>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Bloque visual con el codigo numerico de verificacion. */
function bloqueCodigo(codigo) {
  return `
    <div style="background:#f4f7fb;border:1px dashed #b0cbea;border-radius:12px;padding:20px;text-align:center;margin:18px 0;">
      <div style="font-size:12px;color:#5a6b80;text-transform:uppercase;letter-spacing:1px;">Codigo de verificacion</div>
      <div style="font-size:34px;font-weight:700;color:#0b2039;letter-spacing:8px;margin-top:8px;">${codigo}</div>
    </div>`;
}

const servicioCorreo = {
  correoEstaConfigurado,

  /** Correo de bienvenida con el codigo de verificacion de 6 digitos. */
  async enviarCodigoVerificacion({ destino, nombres, codigo, minutosExpiracion = 15 }) {
    const html = plantillaBase({
      titulo: `Bienvenido a ${configuracionInstitucional.nombrePlataforma}`,
      contenidoHtml: `
        <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">
          Hola <strong>${nombres}</strong>, tu cuenta fue registrada correctamente con tu correo institucional.
        </p>
        <p style="font-size:15px;line-height:1.6;margin:0;">
          Para activar tu cuenta ingresa el siguiente codigo:
        </p>
        ${bloqueCodigo(codigo)}
        <p style="font-size:14px;line-height:1.6;color:#5a6b80;margin:0;">
          El codigo vence en ${minutosExpiracion} minutos y solo puede usarse una vez.
          Tienes un maximo de 5 intentos por codigo.
        </p>`,
    });

    return enviarCorreo({
      destino,
      asunto: `Codigo de verificacion - ${configuracionInstitucional.nombrePlataforma}`,
      html,
      texto: `Tu codigo de verificacion de EMI Connect es: ${codigo} (vence en ${minutosExpiracion} minutos).`,
    });
  },

  /** Correo con codigo para restablecer la contrasena. */
  async enviarCodigoRecuperacion({ destino, nombres, codigo, minutosExpiracion = 30 }) {
    const html = plantillaBase({
      titulo: 'Solicitud de cambio de contrasena',
      contenidoHtml: `
        <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">
          Hola <strong>${nombres}</strong>, recibimos una solicitud para restablecer la contrasena de tu cuenta.
        </p>
        <p style="font-size:15px;line-height:1.6;margin:0;">
          Ingresa este codigo en la plataforma para continuar:
        </p>
        ${bloqueCodigo(codigo)}
        <p style="font-size:14px;line-height:1.6;color:#5a6b80;margin:0;">
          El codigo vence en ${minutosExpiracion} minutos. Si no solicitaste el cambio,
          ignora este mensaje: tu contrasena actual seguira funcionando.
        </p>`,
    });

    return enviarCorreo({
      destino,
      asunto: 'Recuperacion de contrasena - EMI Connect',
      html,
      texto: `Tu codigo para restablecer la contrasena es: ${codigo} (vence en ${minutosExpiracion} minutos).`,
    });
  },

  /** Aviso generico reutilizable para notificaciones importantes. */
  async enviarNotificacionImportante({ destino, nombres, titulo, mensaje, enlace = '' }) {
    const html = plantillaBase({
      titulo,
      contenidoHtml: `
        <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">Hola <strong>${nombres}</strong>:</p>
        <p style="font-size:15px;line-height:1.6;margin:0;">${mensaje}</p>
        ${
          enlace
            ? `<p style="margin-top:20px;"><a href="${enlace}" style="background:#1d4d8c;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;">Abrir en EMI Connect</a></p>`
            : ''
        }`,
    });

    return enviarCorreo({ destino, asunto: titulo, html, texto: mensaje });
  },
};

module.exports = { servicioCorreo };
