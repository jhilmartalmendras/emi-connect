const { Server } = require('socket.io');
const { verificarTokenSesion } = require('../utilidades/tokenJwt');
const { repositorioUsuario } = require('../repositorios/repositorioUsuario');
const { repositorioConversacion } = require('../repositorios/repositorioConversacion');
const { servicioMensaje } = require('../servicios/servicioMensaje');
const {
  registrarServidorTiempoReal,
  registrarConexion,
  quitarConexion,
  emitirCambioEstadoUsuario,
} = require('./tiempoReal');
const { variablesEntorno } = require('../config/variablesEntorno');

/**
 * Configura Socket.IO para la mensajeria en tiempo real.
 *
 * Eventos que escucha el servidor:
 *   conversacion:unirse   -> el usuario entra a la sala de una conversacion
 *   conversacion:salir    -> sale de la sala
 *   mensaje:escribiendo   -> indicador de "escribiendo..."
 *   mensaje:leido         -> marca como leidos los mensajes recibidos
 *
 * Eventos que emite el servidor:
 *   notificacion:nueva, mensaje:nuevo, mensaje:leido,
 *   mensajes:contador, usuario:estado, mensaje:escribiendo
 */
function configurarSockets(servidorHttp) {
  const io = new Server(servidorHttp, {
    cors: {
      origin: [
        variablesEntorno.frontendUrl,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ].filter(Boolean),
      credentials: true,
    },
    // Se permite polling como respaldo para navegadores antiguos (Windows 8/8.1).
    transports: ['websocket', 'polling'],
    pingTimeout: 25000,
  });

  // Autenticacion del socket con el mismo JWT de la API.
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization || '').replace('Bearer ', '').trim();

      if (!token) return next(new Error('Debes iniciar sesion para usar la mensajeria.'));

      const datos = verificarTokenSesion(token);
      const usuario = await repositorioUsuario.buscarPorId(datos.id);

      if (!usuario || usuario.bloqueado || !usuario.activo || !usuario.verificado) {
        return next(new Error('Tu cuenta no esta habilitada para la mensajeria.'));
      }

      socket.usuarioId = String(usuario._id);
      socket.nombreUsuario = `${usuario.nombres} ${usuario.apellidos}`;
      return next();
    } catch (error) {
      return next(new Error('La sesion del socket no es valida.'));
    }
  });

  io.on('connection', (socket) => {
    const usuarioId = socket.usuarioId;

    // Sala personal: recibe notificaciones y mensajes de todas sus conversaciones.
    socket.join(`usuario:${usuarioId}`);
    registrarConexion(usuarioId, socket.id);
    emitirCambioEstadoUsuario(usuarioId, true);

    // Contador de mensajes sin leer al conectarse.
    servicioMensaje
      .contarNoLeidosTotales(usuarioId)
      .then((total) => socket.emit('mensajes:contador', { total }))
      .catch(() => {});

    // -------------------------------------------------------------- Conversaciones
    socket.on('conversacion:unirse', async (conversacionId) => {
      try {
        const conversacion = await repositorioConversacion.buscarPorId(conversacionId);
        if (!conversacion) return;

        const participa = conversacion.participantes.some(
          (participante) => String(participante._id) === usuarioId
        );
        if (!participa) return;

        socket.join(`conversacion:${conversacionId}`);
        await servicioMensaje.marcarComoLeidos(conversacionId, usuarioId);
      } catch (error) {
        console.error('[sockets] Error al unirse a la conversacion:', error.message);
      }
    });

    socket.on('conversacion:salir', (conversacionId) => {
      socket.leave(`conversacion:${conversacionId}`);
    });

    // -------------------------------------------------------------- Escribiendo
    socket.on('mensaje:escribiendo', ({ conversacionId, escribiendo }) => {
      if (!conversacionId) return;
      socket.to(`conversacion:${conversacionId}`).emit('mensaje:escribiendo', {
        conversacionId,
        usuario: usuarioId,
        escribiendo: Boolean(escribiendo),
      });
    });

    // -------------------------------------------------------------- Marcar como leido
    socket.on('mensaje:leido', async (conversacionId) => {
      try {
        await servicioMensaje.marcarComoLeidos(conversacionId, usuarioId);
      } catch (error) {
        console.error('[sockets] Error al marcar mensajes como leidos:', error.message);
      }
    });

    socket.on('disconnect', () => {
      quitarConexion(usuarioId, socket.id);
      // Solo se marca como desconectado si no quedan otras sesiones abiertas.
      const sigueConectado = io.sockets.adapter.rooms.get(`usuario:${usuarioId}`);
      if (!sigueConectado || sigueConectado.size === 0) {
        emitirCambioEstadoUsuario(usuarioId, false);
      }
    });
  });

  // El resto de la aplicacion (servicios) usa este puente para emitir eventos.
  registrarServidorTiempoReal(io);

  console.log('[sockets] Comunicacion en tiempo real habilitada.');
  return io;
}

module.exports = { configurarSockets };
