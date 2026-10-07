const { repositorioUsuario } = require('../repositorios/repositorioUsuario');
const { repositorioPublicacion } = require('../repositorios/repositorioPublicacion');
const { repositorioReporte } = require('../repositorios/repositorioReporte');
const { repositorioComunidad } = require('../repositorios/repositorioComunidad');
const { ErrorAplicacion } = require('../utilidades/ErrorAplicacion');
const { normalizarPaginacion, metadatosPaginacion, escaparExpresionRegular } = require('../utilidades/paginacion');
const { esRolAdministracion } = require('../constantes/roles');

/**
 * Servicio de administracion.
 * Concentra las consultas ampliadas del panel (incluye contenido eliminado,
 * usuarios bloqueados y filtros avanzados) para no exponerlas en otros modulos.
 */
const servicioAdministracion = {
  /** Listado de usuarios con filtros administrativos. */
  async listarUsuarios(consulta = {}, usuario) {
    this.validarAdministracion(usuario);

    const { pagina, limite, saltar } = normalizarPaginacion(consulta, 20, 100);
    const filtro = {};

    if (consulta.rol) filtro.rol = consulta.rol;
    if (consulta.estado === 'bloqueados') filtro.bloqueado = true;
    if (consulta.estado === 'activos') filtro.bloqueado = false;
    if (consulta.estado === 'noVerificados') filtro.verificado = false;
    if (consulta.carrera) filtro.carrera = consulta.carrera;

    if (consulta.buscar) {
      const patron = new RegExp(escaparExpresionRegular(consulta.buscar), 'i');
      filtro.$or = [{ nombres: patron }, { apellidos: patron }, { correo: patron }, { carrera: patron }];
    }

    const [usuarios, total] = await Promise.all([
      repositorioUsuario.listar({ filtro, saltar, limite }),
      repositorioUsuario.contar(filtro),
    ]);

    return { usuarios, paginacion: metadatosPaginacion(total, pagina, limite) };
  },

  /** Bloquea o desbloquea a un usuario. */
  async cambiarBloqueoUsuario(usuarioId, usuario, { bloqueado, motivo = '' }) {
    this.validarAdministracion(usuario);

    if (String(usuarioId) === String(usuario._id)) {
      throw ErrorAplicacion.solicitudInvalida('No puedes bloquear tu propia cuenta.');
    }

    const objetivo = await repositorioUsuario.buscarPorId(usuarioId);
    if (!objetivo) throw ErrorAplicacion.noEncontrado('El usuario no existe.');

    if (bloqueado && objetivo.rol === 'administrador') {
      const otrosAdministradores = await repositorioUsuario.contar({
        rol: 'administrador',
        bloqueado: false,
        _id: { $ne: objetivo._id },
      });
      if (otrosAdministradores === 0) {
        throw ErrorAplicacion.prohibido('No puedes bloquear al ultimo administrador de la plataforma.');
      }
    }

    const actualizado = await repositorioUsuario.actualizarPorId(usuarioId, {
      bloqueado: Boolean(bloqueado),
      motivoBloqueo: bloqueado ? motivo : '',
    });

    return {
      usuario: actualizado.datosPublicos(),
      mensaje: bloqueado ? 'Usuario bloqueado correctamente.' : 'Usuario desbloqueado correctamente.',
    };
  },

  /** Activa o desactiva una cuenta. */
  async cambiarEstadoCuenta(usuarioId, usuario, activo) {
    this.validarAdministracion(usuario);
    if (String(usuarioId) === String(usuario._id)) {
      throw ErrorAplicacion.solicitudInvalida('No puedes desactivar tu propia cuenta.');
    }

    const actualizado = await repositorioUsuario.actualizarPorId(usuarioId, {
      activo: Boolean(activo),
      cuentaEliminada: activo ? false : true,
    });
    if (!actualizado) throw ErrorAplicacion.noEncontrado('El usuario no existe.');

    return {
      usuario: actualizado.datosPublicos(),
      mensaje: activo ? 'Cuenta activada correctamente.' : 'Cuenta desactivada correctamente.',
    };
  },

  /** Publicaciones (incluidas las eliminadas) para revision. */
  async listarPublicaciones(consulta = {}, usuario) {
    this.validarAdministracion(usuario);

    const { pagina, limite, saltar } = normalizarPaginacion(consulta, 20, 50);
    const filtro = {};

    if (consulta.categoria) filtro.categoria = consulta.categoria;
    if (consulta.estado === 'eliminadas') filtro.eliminado = true;
    if (consulta.estado === 'activas') filtro.eliminado = false;
    if (consulta.autor) filtro.autor = consulta.autor;

    if (consulta.buscar) {
      filtro.contenido = new RegExp(escaparExpresionRegular(consulta.buscar), 'i');
    }

    const [publicaciones, total] = await Promise.all([
      repositorioPublicacion.listarAdmin({ filtro, saltar, limite }),
      repositorioPublicacion.contarAdmin(filtro),
    ]);

    return { publicaciones, paginacion: metadatosPaginacion(total, pagina, limite) };
  },

  /** Restaura una publicacion eliminada. */
  async restaurarPublicacion(publicacionId, usuario) {
    this.validarAdministracion(usuario);
    const publicacion = await repositorioPublicacion.restaurar(publicacionId);
    if (!publicacion) throw ErrorAplicacion.noEncontrado('La publicacion no existe.');
    return { publicacion, mensaje: 'Publicacion restaurada correctamente.' };
  },

  /** Elimina definitivamente una publicacion y su contenido asociado. */
  async eliminarPublicacionDefinitiva(publicacionId, usuario) {
    this.validarAdministracion(usuario);
    const publicacion = await repositorioPublicacion.buscarPorId(publicacionId, false);
    if (!publicacion) throw ErrorAplicacion.noEncontrado('La publicacion no existe.');

    await repositorioReporte.eliminarPorObjetivo(publicacionId);
    await repositorioPublicacion.eliminarPorId(publicacionId);

    return { mensaje: 'La publicacion fue eliminada definitivamente.' };
  },

  /** Comunidades para el panel administrativo (incluye desactivadas). */
  async listarComunidades(consulta = {}, usuario) {
    this.validarAdministracion(usuario);

    const { pagina, limite, saltar } = normalizarPaginacion(consulta, 20, 50);
    const filtro = {};
    if (consulta.buscar) {
      filtro.nombre = new RegExp(escaparExpresionRegular(consulta.buscar), 'i');
    }

    const [comunidades, total] = await Promise.all([
      repositorioComunidad.listar({ filtro: { ...filtro, activa: false }, saltar, limite }),
      repositorioComunidad.contar({ ...filtro, activa: false }).then(async (desactivadas) => {
        const activas = await repositorioComunidad.contar(filtro);
        return activas + desactivadas;
      }),
    ]);

    return { comunidades, paginacion: metadatosPaginacion(total, pagina, limite) };
  },

  /** Activa o desactiva una comunidad. */
  async cambiarEstadoComunidad(comunidadId, usuario, activa) {
    this.validarAdministracion(usuario);
    const comunidad = await repositorioComunidad.actualizarPorId(comunidadId, { activa: Boolean(activa) });
    if (!comunidad) throw ErrorAplicacion.noEncontrado('La comunidad no existe.');
    return {
      comunidad,
      mensaje: activa ? 'Comunidad reactivada correctamente.' : 'Comunidad desactivada correctamente.',
    };
  },

  /** Reportes pendientes con el detalle de cada contenido (vista del panel). */
  listarReportesPendientes(usuario) {
    this.validarAdministracion(usuario);
    return repositorioReporte.listar({ filtro: { estado: 'pendiente' }, limite: 20 });
  },

  /** Valida que el usuario pertenezca a la administracion. */
  validarAdministracion(usuario) {
    if (!usuario || !esRolAdministracion(usuario.rol)) {
      throw ErrorAplicacion.prohibido('Solo la administracion puede acceder a esta informacion.');
    }
  },
};

module.exports = { servicioAdministracion };
