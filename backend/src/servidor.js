const http = require('http');
const { crearAplicacion } = require('./aplicaciones/aplicacion');
const { configurarSockets } = require('./aplicaciones/sockets');
const { conectarBaseDatos, desconectarBaseDatos } = require('./config/baseDatos');
const { variablesEntorno, validarVariablesEntorno } = require('./config/variablesEntorno');
const { configuracionInstitucional } = require('./config/institucional');
const { correoEstaConfigurado } = require('./config/correo');

/**
 * Arranque del servidor de EMI Connect.
 * 1) valida la configuracion
 * 2) conecta MongoDB
 * 3) levanta Express + Socket.IO
 */
async function iniciar() {
  try {
    validarVariablesEntorno();
    await conectarBaseDatos();

    const aplicacion = crearAplicacion();
    const servidorHttp = http.createServer(aplicacion);
    configurarSockets(servidorHttp);

    servidorHttp.listen(variablesEntorno.puerto, () => {
      console.log('');
      console.log('==================================================');
      console.log(`  ${configuracionInstitucional.nombrePlataforma}`);
      console.log(`  ${configuracionInstitucional.nombreInstitucion}`);
      console.log('==================================================');
      console.log(`  API:        http://localhost:${variablesEntorno.puerto}/api`);
      console.log(`  Estado:     http://localhost:${variablesEntorno.puerto}/api/salud`);
      console.log(`  Frontend:   ${variablesEntorno.frontendUrl}`);
      console.log(`  Entorno:    ${variablesEntorno.entorno}`);
      console.log(
        `  Correo:     ${variablesEntorno.correo.emisor} ${
          correoEstaConfigurado() ? '(SMTP activo)' : '(modo desarrollo: los codigos se muestran en consola)'
        }`
      );
      console.log('==================================================');
      console.log('');
    });

    // Cierre ordenado del servidor (Ctrl+C o detencion del servicio).
    const cerrar = async (senal) => {
      console.log(`\n[servidor] Recibida senal ${senal}. Cerrando EMI Connect...`);
      servidorHttp.close(async () => {
        await desconectarBaseDatos();
        console.log('[servidor] Servidor detenido correctamente.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => cerrar('SIGINT'));
    process.on('SIGTERM', () => cerrar('SIGTERM'));

    // Errores no controlados: se registran para diagnostico.
    process.on('unhandledRejection', (motivo) => {
      console.error('[servidor] Promesa rechazada sin manejar:', motivo);
    });
    process.on('uncaughtException', (error) => {
      console.error('[servidor] Excepcion no controlada:', error);
    });

    return servidorHttp;
  } catch (error) {
    console.error('[servidor] No se pudo iniciar EMI Connect:', error.message);
    process.exit(1);
  }
}

// Solo se inicia automaticamente cuando el archivo se ejecuta directamente.
if (require.main === module) {
  iniciar();
}

module.exports = { iniciar };
