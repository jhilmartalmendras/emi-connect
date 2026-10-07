const { repositorioUsuario } = require('../repositorios/repositorioUsuario');
const { repositorioPublicacion } = require('../repositorios/repositorioPublicacion');
const { repositorioComentario } = require('../repositorios/repositorioComentario');
const { repositorioComunidad } = require('../repositorios/repositorioComunidad');
const { repositorioEvento } = require('../repositorios/repositorioEvento');
const { repositorioProducto } = require('../repositorios/repositorioProducto');
const { repositorioReporte } = require('../repositorios/repositorioReporte');
const { repositorioBloqueo } = require('../repositorios/repositorioBloqueo');
const { repositorioMensaje } = require('../repositorios/repositorioMensaje');
const { repositorioAmistad } = require('../repositorios/repositorioAmistad');
const { repositorioHistoria } = require('../repositorios/repositorioHistoria');
const { servicioRecomendacion } = require('./servicioRecomendacion');
const { ErrorAplicacion } = require('../utilidades/ErrorAplicacion');
const { esRolAdministracion } = require('../constantes/roles');
const { haceDias, ahora } = require('../utilidades/fechas');
const { listarUsuariosConectados } = require('../aplicaciones/tiempoReal');

/**
 * Servicio de estadisticas y resumen del panel administrativo.
 * Todas las consultas se resuelven en paralelo para responder rapido.
 */
const servicioEstadistica = {
  /** Resumen general: contadores principales de la plataforma. */
  async obtenerResumen() {
    const desdeHoy = haceDias(1);
    const desdeSemana = haceDias(7);
    const desdeMes = haceDias(30);

    const [
      usuariosTotales,
      usuariosNuevosSemana,
      usuariosActivosMes,
      usuariosBloqueados,
      publicaciones,
      publicacionesSemana,
      comentarios,
      comunidades,
      eventos,
      productos,
      reportesPendientes,
      reportesTotales,
      bloqueos,
      mensajes,
      amistades,
      historiasActivas,
    ] = await Promise.all([
      repositorioUsuario.contar({ cuentaEliminada: false }),
      repositorioUsuario.contar({ fechaCreacion: { $gte: desdeSemana } }),
      repositorioUsuario.contar({ fechaUltimaConexion: { $gte: desdeMes } }),
      repositorioUsuario.contar({ bloqueado: true }),
      repositorioPublicacion.contar(),
      repositorioPublicacion.contar({ fechaCreacion: { $gte: desdeSemana } }),
      repositorioComentario.contar(),
      repositorioComunidad.contar(),
      repositorioEvento.contar(),
      repositorioProducto.contar(),
      repositorioReporte.contar({ estado: 'pendiente' }),
      repositorioReporte.contar(),
      repositorioBloqueo.contar(),
      repositorioMensaje.contarDesde(haceDias(30)),
      repositorioAmistad.contar(),
      repositorioHistoria.contar({ activa: true, expiraEn: { $gt: ahora() } }),
    ]);

    return {
      usuarios: {
        total: usuariosTotales,
        nuevosUltimaSemana: usuariosNuevosSemana,
        activosUltimoMes: usuariosActivosMes,
        bloqueados: usuariosBloqueados,
        conectadosAhora: listarUsuariosConectados().length,
      },
      publicaciones: { total: publicaciones, ultimaSemana: publicacionesSemana },
      comentarios: { total: comentarios, ultimoMes: await repositorioComentario.contarDesde(desdeMes) },
      comunidades: { total: comunidades },
      eventos: { total: eventos },
      productos: { total: productos },
      reportes: { pendientes: reportesPendientes, total: reportesTotales },
      bloqueos: { total: bloqueos },
      mensajes: { ultimoMes: mensajes },
      amistades: { total: amistades },
      historiasActivas: { total: historiasActivas },
      generadoEn: new Date().toISOString(),
    };
  },

  /** Series de crecimiento para las graficas del panel. */
  async obtenerCrecimiento(consulta = {}) {
    const dias = Math.min(Math.max(Number(consulta.dias) || 30, 7), 180);
    const desde = haceDias(dias);

    const [usuariosPorDia, publicacionesPorDia, categorias, reportesPorEstado, eventosPorMes] = await Promise.all([
      repositorioUsuario.contarPorDia(desde),
      repositorioPublicacion.contarPorDia(desde),
      repositorioPublicacion.contarPorCategoria(),
      repositorioReporte.contarPorEstado(),
      repositorioEvento.contar({ fecha: { $gte: ahora() } }),
    ]);

    return {
      dias,
      usuariosPorDia,
      publicacionesPorDia,
      publicacionesPorCategoria: categorias.map((item) => ({ categoria: item._id, cantidad: item.cantidad })),
      reportesPorEstado: reportesPorEstado.map((item) => ({ estado: item._id, cantidad: item.cantidad })),
      eventosProximos: eventosPorMes,
    };
  },

  /** Actividad reciente para el panel administrativo. */
  async obtenerActividadReciente(usuario) {
    if (!esRolAdministracion(usuario.rol)) {
      throw ErrorAplicacion.prohibido('Solo la administracion puede ver la actividad de la plataforma.');
    }

    const [usuarios, publicaciones, comunidades, eventos, productos] = await Promise.all([
      repositorioUsuario.listar({ limite: 5 }),
      repositorioPublicacion.listar({ limite: 5 }),
      repositorioComunidad.listarRecientes(5),
      repositorioEvento.listarRecientes(5),
      repositorioProducto.listarRecientes(5),
    ]);

    return {
      usuariosRecientes: usuarios.map((usuarioItem) => ({
        _id: usuarioItem._id,
        nombres: usuarioItem.nombres,
        apellidos: usuarioItem.apellidos,
        correo: usuarioItem.correo,
        rol: usuarioItem.rol,
        fotoPerfil: usuarioItem.fotoPerfil,
        fechaCreacion: usuarioItem.fechaCreacion,
      })),
      publicacionesRecientes: publicaciones,
      comunidadesRecientes: comunidades,
      eventosRecientes: eventos,
      productosRecientes: productos,
    };
  },

  /** Panel de inicio del usuario: resumen de su propia actividad. */
  async obtenerResumenUsuario(usuarioId) {
    const [cantidadPublicaciones, cantidadAmigos, comunidades, mensajesNoLeidos, notificaciones] = await Promise.all([
      repositorioPublicacion.contarPorAutor(usuarioId),
      repositorioAmistad.contarAceptadas(usuarioId),
      repositorioComunidad.listar({ filtro: {}, limite: 4 }),
      repositorioMensaje.contar(),
      repositorioUsuario.contar({ activo: true }),
    ]);

    return {
      misPublicaciones: cantidadPublicaciones,
      misAmigos: cantidadAmigos,
      sugerenciasComunidades: comunidades,
      mensajesEnPlataforma: mensajesNoLeidos,
      usuariosActivos: notificaciones,
    };
  },

  /** Recomendaciones personalizadas (reutiliza el motor de recomendaciones). */
  obtenerRecomendaciones(usuarioId, limites) {
    return servicioRecomendacion.obtenerRecomendaciones(usuarioId, limites);
  },
};

module.exports = { servicioEstadistica };
