const { repositorioReporte } = require('../repositorios/repositorioReporte');
const { repositorioUsuario } = require('../repositorios/repositorioUsuario');
const { repositorioPublicacion } = require('../repositorios/repositorioPublicacion');
const { repositorioComentario } = require('../repositorios/repositorioComentario');
const { repositorioProducto } = require('../repositorios/repositorioProducto');
const { repositorioComunidad } = require('../repositorios/repositorioComunidad');
const { servicioNotificacion } = require('./servicioNotificacion');
const { ErrorAplicacion } = require('../utilidades/ErrorAplicacion');
const { normalizarPaginacion, metadatosPaginacion } = require('../utilidades/paginacion');
const { esRolAdministracion } = require('../constantes/roles');

// Modelo Mongoose asociado a cada tipo de contenido reportable.
const MODELOS_POR_TIPO = {
  publicacion: { modelo: 'Publicacion', repositorio: repositorioPublicacion, campoAutor: 'autor' },
  comentario: { modelo: 'Comentario', repositorio: repositorioComentario, campoAutor: 'autor' },
  usuario: { modelo: 'Usuario', repositorio: null, campoAutor: null },
  producto: { modelo: 'Producto', repositorio: repositorioProducto, campoAutor: 'vendedor' },
  comunidad: { modelo: 'Comunidad', repositorio: repositorioComunidad, campoAutor: 'creador' },
};

/**
 * Servicio de reportes.
 * Cualquier usuario puede reportar contenido; la administracion revisa y resuelve.
 */
const servicioReporte = {
  /** Verifica que el contenido reportado exista antes de registrar el reporte. */
  async validarObjetivo(tipo, objetivoId) {
    const configuracion = MODELOS_POR_TIPO[tipo];
    if (!configuracion) throw ErrorAplicacion.solicitudInvalida('El tipo de contenido a reportar no es valido.');

    if (tipo === 'usuario') {
      const usuario = await repositorioUsuario.buscarPorId(objetivoId);
      if (!usuario) throw ErrorAplicacion.noEncontrado('El usuario reportado no existe.');
      return configuracion;
    }

    const documento = await configuracion.repositorio.buscarPorId(objetivoId);
    if (!documento) throw ErrorAplicacion.noEncontrado('El contenido reportado no existe.');
    return configuracion;
  },

  async crearReporte(usuario, { tipo, objetivoId, motivo, descripcion = '' }) {
    const configuracion = await this.validarObjetivo(tipo, objetivoId);

    // Un usuario no puede reportar su propio contenido.
    if (configuracion.campoAutor) {
      const documento = await configuracion.repositorio.buscarPorId(objetivoId);
      const autorId = documento[configuracion.campoAutor]?._id || documento[configuracion.campoAutor];
      if (String(autorId) === String(usuario._id)) {
        throw ErrorAplicacion.solicitudInvalida('No puedes reportar tu propio contenido.');
      }
    } else if (String(objetivoId) === String(usuario._id)) {
      throw ErrorAplicacion.solicitudInvalida('No puedes reportarte a ti mismo.');
    }

    const existente = await repositorioReporte.buscarExistente({
      reportante: usuario._id,
      objetivo: objetivoId,
      tipo,
    });
    if (existente) throw ErrorAplicacion.conflicto('Ya reportaste este contenido anteriormente.');

    const reporte = await repositorioReporte.crear({
      reportante: usuario._id,
      tipo,
      objetivo: objetivoId,
      objetivoModelo: configuracion.modelo,
      motivo,
      descripcion,
      estado: 'pendiente',
    });

    return { reporte, mensaje: 'Gracias por tu reporte. La administracion lo revisara.' };
  },

  /** Listado de reportes para el panel administrativo. */
  async listarReportes(consulta = {}, usuario) {
    if (!esRolAdministracion(usuario.rol)) {
      throw ErrorAplicacion.prohibido('Solo la administracion puede revisar los reportes.');
    }

    const { pagina, limite, saltar } = normalizarPaginacion(consulta, 20, 50);
    const filtro = {};
    if (consulta.estado) filtro.estado = consulta.estado;
    if (consulta.tipo) filtro.tipo = consulta.tipo;

    const [reportes, total] = await Promise.all([
      repositorioReporte.listar({ filtro, saltar, limite }),
      repositorioReporte.contar(filtro),
    ]);

    // Se adjunta un resumen del contenido reportado para poder juzgarlo.
    const conResumen = await Promise.all(
      reportes.map(async (reporte) => {
        const configuracion = MODELOS_POR_TIPO[reporte.tipo];
        let resumen = null;

        try {
          if (reporte.tipo === 'usuario') {
            const usuarioReportado = await repositorioUsuario.buscarPorId(reporte.objetivo);
            resumen = usuarioReportado
              ? {
                  titulo: `${usuarioReportado.nombres} ${usuarioReportado.apellidos}`,
                  texto: usuarioReportado.correo,
                  autor: usuarioReportado._id,
                }
              : null;
          } else if (configuracion) {
            const documento = await configuracion.repositorio.buscarPorId(reporte.objetivo);
            if (documento) {
              const autor = documento[configuracion.campoAutor];
              resumen = {
                titulo: documento.nombre || documento.titulo || 'Contenido',
                texto: documento.contenido || documento.descripcion || '',
                eliminado: Boolean(documento.eliminado),
                autor: autor?._id || autor,
              };
            }
          }
        } catch (error) {
          resumen = null;
        }

        return { ...reporte, resumen };
      })
    );

    return { reportes: conResumen, paginacion: metadatosPaginacion(total, pagina, limite) };
  },

  /** Resuelve o rechaza un reporte y aplica la accion correspondiente. */
  async resolverReporte(reporteId, usuario, { estado, notaRevision = '', accion = 'ninguna' }) {
    if (!esRolAdministracion(usuario.rol)) {
      throw ErrorAplicacion.prohibido('Solo la administracion puede resolver reportes.');
    }

    const reporte = await repositorioReporte.buscarPorId(reporteId);
    if (!reporte) throw ErrorAplicacion.noEncontrado('El reporte no existe.');

    let accionTomada = 'ninguna';

    if (accion === 'eliminar_contenido') {
      const configuracion = MODELOS_POR_TIPO[reporte.tipo];
      if (reporte.tipo === 'publicacion') {
        await repositorioPublicacion.marcarEliminada(reporte.objetivo, {
          eliminadoPor: usuario._id,
          motivo: `Reporte resuelto: ${reporte.motivo}`,
        });
        accionTomada = 'contenido_eliminado';
      } else if (reporte.tipo === 'comentario') {
        await repositorioComentario.marcarEliminado(reporte.objetivo);
        accionTomada = 'contenido_eliminado';
      } else if (reporte.tipo === 'producto') {
        await repositorioProducto.actualizarPorId(reporte.objetivo, { activo: false });
        accionTomada = 'contenido_eliminado';
      } else if (reporte.tipo === 'comunidad') {
        await repositorioComunidad.actualizarPorId(reporte.objetivo, { activa: false });
        accionTomada = 'contenido_eliminado';
      } else if (reporte.tipo === 'usuario') {
        await repositorioUsuario.actualizarPorId(reporte.objetivo, {
          bloqueado: true,
          motivoBloqueo: `Bloqueado por reporte: ${reporte.motivo}`,
        });
        accionTomada = 'usuario_bloqueado';
      }
      if (!configuracion && reporte.tipo !== 'usuario') accionTomada = 'ninguna';
    }

    if (accion === 'bloquear_usuario') {
      const configuracion = MODELOS_POR_TIPO[reporte.tipo];
      if (configuracion && configuracion.campoAutor) {
        const documento = await configuracion.repositorio.buscarPorId(reporte.objetivo);
        const autorId = documento[configuracion.campoAutor]?._id || documento?.[configuracion.campoAutor];
        if (autorId) {
          await repositorioUsuario.actualizarPorId(autorId, {
            bloqueado: true,
            motivoBloqueo: `Bloqueado por reporte: ${reporte.motivo}`,
          });
          accionTomada = 'usuario_bloqueado';
        }
      } else if (reporte.tipo === 'usuario') {
        await repositorioUsuario.actualizarPorId(reporte.objetivo, {
          bloqueado: true,
          motivoBloqueo: `Bloqueado por reporte: ${reporte.motivo}`,
        });
        accionTomada = 'usuario_bloqueado';
      }
    }

    const actualizado = await repositorioReporte.actualizarPorId(reporteId, {
      estado,
      notaRevision,
      revisadoPor: usuario._id,
      fechaRevision: new Date(),
      accionTomada,
    });

    // Se avisa al reportante que su reporte fue atendido.
    await servicioNotificacion.crear({
      usuario: reporte.reportante._id || reporte.reportante,
      tipo: 'reporte_resuelto',
      titulo: 'Tu reporte fue revisado',
      mensaje: `El reporte que enviaste fue marcado como "${estado}".`,
      enlace: '/notificaciones',
    });

    return { reporte: actualizado, mensaje: 'Reporte actualizado correctamente.' };
  },

  /** Reportes pendientes (contador del panel). */
  contarPendientes() {
    return repositorioReporte.contar({ estado: 'pendiente' });
  },

  /** Reportes creados por el usuario autenticado. */
  async listarMisReportes(usuarioId, consulta = {}) {
    const { pagina, limite, saltar } = normalizarPaginacion(consulta, 20, 50);
    const [reportes, total] = await Promise.all([
      repositorioReporte.listar({ filtro: { reportante: usuarioId }, saltar, limite }),
      repositorioReporte.contar({ reportante: usuarioId }),
    ]);
    return { reportes, paginacion: metadatosPaginacion(total, pagina, limite) };
  },
};

module.exports = { servicioReporte, MODELOS_POR_TIPO };
