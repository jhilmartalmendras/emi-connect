const { repositorioComunidad } = require('../repositorios/repositorioComunidad');
const { repositorioMiembroComunidad } = require('../repositorios/repositorioMiembroComunidad');
const { repositorioUsuario } = require('../repositorios/repositorioUsuario');
const { repositorioPublicacion } = require('../repositorios/repositorioPublicacion');
const { repositorioAmistad } = require('../repositorios/repositorioAmistad');
const { repositorioBloqueo } = require('../repositorios/repositorioBloqueo');
const { repositorioNotificacion } = require('../repositorios/repositorioNotificacion');
const { servicioNotificacion } = require('./servicioNotificacion');
const { ErrorAplicacion } = require('../utilidades/ErrorAplicacion');
const { normalizarPaginacion, metadatosPaginacion } = require('../utilidades/paginacion');
const { esRolAdministracion } = require('../constantes/roles');

/**
 * Servicio de comunidades.
 * Maneja creacion, membresias, roles internos, invitaciones y reglas.
 */
const servicioComunidad = {
  /** Crea una comunidad y registra al creador como administrador. */
  async crearComunidad(usuario, datos) {
    const comunidad = await repositorioComunidad.crear({
      nombre: datos.nombre,
      descripcion: datos.descripcion || '',
      imagen: datos.imagen || '',
      portada: datos.portada || '',
      categoria: datos.categoria || 'general',
      creador: usuario._id,
      reglas: datos.reglas || [],
      esPrivada: Boolean(datos.esPrivada),
      cantidadMiembros: 1,
    });

    await repositorioMiembroComunidad.crear({
      comunidad: comunidad._id,
      usuario: usuario._id,
      rol: 'administrador',
      estado: 'activo',
    });

    await repositorioUsuario.incrementarCampos(usuario._id, { cantidadComunidades: 1 });

    return comunidad;
  },

  /** Lista comunidades con filtros y busqueda opcional. */
  async listarComunidades(consulta = {}, usuarioId = null) {
    const { pagina, limite, saltar } = normalizarPaginacion(consulta, 12, 48);
    const filtro = {};

    if (consulta.categoria) filtro.categoria = consulta.categoria;
    if (consulta.filtro === 'misComunidades' && usuarioId) {
      const registros = await repositorioMiembroComunidad.listarIdsComunidadesDeUsuario(usuarioId);
      filtro._id = { $in: registros.map((registro) => registro.comunidad) };
    }

    const [comunidades, total] = await Promise.all([
      repositorioComunidad.listar({ filtro, saltar, limite }),
      repositorioComunidad.contar(filtro),
    ]);

    // Se marca en que comunidades el usuario ya participa.
    let misComunidades = new Set();
    if (usuarioId) {
      const registros = await repositorioMiembroComunidad.listarIdsComunidadesDeUsuario(usuarioId);
      misComunidades = new Set(registros.map((registro) => String(registro.comunidad)));
    }

    return {
      comunidades: comunidades.map((comunidad) => ({
        ...comunidad,
        soyMiembro: misComunidades.has(String(comunidad._id)),
      })),
      paginacion: metadatosPaginacion(total, pagina, limite),
    };
  },

  /** Detalle de una comunidad con informacion de la membresia del solicitante. */
  async obtenerComunidad(id, usuarioId = null) {
    const comunidad = await repositorioComunidad.buscarPorId(id);
    if (!comunidad || !comunidad.activa) {
      throw ErrorAplicacion.noEncontrado('La comunidad no existe o fue desactivada.');
    }

    const miembros = await repositorioMiembroComunidad.listarMiembros(id, { limite: 12 });

    let membresia = null;
    if (usuarioId) {
      membresia = await repositorioMiembroComunidad.buscar({ comunidad: id, usuario: usuarioId });
    }

    const esAdministrador =
      membresia && (membresia.rol === 'administrador' || membresia.rol === 'moderador');

    return {
      comunidad: {
        ...comunidad.toObject(),
        soyMiembro: Boolean(membresia && membresia.estado === 'activo'),
        puedoAdministrar: Boolean(esAdministrador) || (usuarioId && esRolAdministracion('administrador')),
        esCreador: String(comunidad.creador._id) === String(usuarioId),
      },
      miembros: miembros.map((miembro) => ({ ...miembro, usuario: miembro.usuario })),
    };
  },

  /** Unirse a una comunidad (privada queda pendiente de aprobacion). */
  async unirseComunidad(comunidadId, usuario) {
    const comunidad = await repositorioComunidad.buscarPorId(comunidadId);
    if (!comunidad || !comunidad.activa) throw ErrorAplicacion.noEncontrado('La comunidad no existe.');

    const existente = await repositorioMiembroComunidad.buscar({ comunidad: comunidadId, usuario: usuario._id });
    if (existente) {
      if (existente.estado === 'activo') throw ErrorAplicacion.conflicto('Ya eres miembro de esta comunidad.');
      if (existente.estado === 'pendiente') {
        throw ErrorAplicacion.conflicto('Tu solicitud de ingreso esta pendiente de aprobacion.');
      }
    }

    const estado = comunidad.esPrivada ? 'pendiente' : 'activo';

    if (existente) {
      await repositorioMiembroComunidad.actualizarPorId(existente._id, { estado, rol: 'miembro' });
    } else {
      await repositorioMiembroComunidad.crear({ comunidad: comunidadId, usuario: usuario._id, estado });
    }

    if (estado === 'activo') {
      await repositorioComunidad.incrementarCampos(comunidadId, { cantidadMiembros: 1 });
      await repositorioUsuario.incrementarCampos(usuario._id, { cantidadComunidades: 1 });

      await servicioNotificacion.crear({
        usuario: comunidad.creador._id || comunidad.creador,
        actor: usuario._id,
        tipo: 'comunidad',
        titulo: `${usuario.nombres} se unio a tu comunidad`,
        mensaje: `${usuario.nombres} ${usuario.apellidos} se unio a ${comunidad.nombre}.`,
        enlace: `/comunidades/${comunidadId}`,
        referencias: { comunidad: comunidadId },
      });
    } else {
      await servicioNotificacion.crear({
        usuario: comunidad.creador._id || comunidad.creador,
        actor: usuario._id,
        tipo: 'comunidad',
        titulo: 'Nueva solicitud de ingreso',
        mensaje: `${usuario.nombres} solicito unirse a ${comunidad.nombre}.`,
        enlace: `/comunidades/${comunidadId}`,
        referencias: { comunidad: comunidadId },
      });
    }

    return {
      estado,
      mensaje:
        estado === 'activo'
          ? 'Te uniste a la comunidad correctamente.'
          : 'Solicitud enviada. Un administrador debe aprobarla.',
    };
  },

  /** Salir de una comunidad (el creador no puede salir sin transferir o eliminar). */
  async salirComunidad(comunidadId, usuarioId) {
    const comunidad = await repositorioComunidad.buscarPorId(comunidadId);
    if (!comunidad) throw ErrorAplicacion.noEncontrado('La comunidad no existe.');

    if (String(comunidad.creador._id) === String(usuarioId)) {
      throw ErrorAplicacion.solicitudInvalida(
        'El creador no puede salir de la comunidad. Puede eliminarla desde la administracion.'
      );
    }

    const membresia = await repositorioMiembroComunidad.buscar({ comunidad: comunidadId, usuario: usuarioId });
    if (!membresia || membresia.estado !== 'activo') {
      throw ErrorAplicacion.solicitudInvalida('No eres miembro activo de esta comunidad.');
    }

    await repositorioMiembroComunidad.eliminar({ comunidad: comunidadId, usuario: usuarioId });
    await repositorioComunidad.incrementarCampos(comunidadId, { cantidadMiembros: -1 });
    await repositorioUsuario.incrementarCampos(usuarioId, { cantidadComunidades: -1 });

    return { mensaje: 'Saliste de la comunidad.' };
  },

  /** Aprueba o rechaza una solicitud de ingreso (administradores de la comunidad). */
  async gestionarSolicitud(comunidadId, miembroId, usuario, accion) {
    const comunidad = await repositorioComunidad.buscarPorId(comunidadId);
    if (!comunidad) throw ErrorAplicacion.noEncontrado('La comunidad no existe.');

    const membresiaSolicitante = await repositorioMiembroComunidad.buscarPorId(miembroId);
    if (!membresiaSolicitante || String(membresiaSolicitante.comunidad) !== String(comunidadId)) {
      throw ErrorAplicacion.noEncontrado('La solicitud de ingreso no existe.');
    }

    const miMembresia = await repositorioMiembroComunidad.buscar({ comunidad: comunidadId, usuario: usuario._id });
    const esCreador = String(comunidad.creador._id) === String(usuario._id);
    const puedeGestionar =
      esCreador || (miMembresia && ['administrador', 'moderador'].includes(miMembresia.rol));
    if (!puedeGestionar) throw ErrorAplicacion.prohibido('No puedes gestionar las solicitudes de esta comunidad.');

    const usuarioSolicitanteId = membresiaSolicitante.usuario._id || membresiaSolicitante.usuario;

    if (accion === 'aprobar') {
      await repositorioMiembroComunidad.actualizarPorId(miembroId, { estado: 'activo' });
      await repositorioComunidad.incrementarCampos(comunidadId, { cantidadMiembros: 1 });
      await repositorioUsuario.incrementarCampos(usuarioSolicitanteId, { cantidadComunidades: 1 });

      await servicioNotificacion.crear({
        usuario: usuarioSolicitanteId,
        actor: usuario._id,
        tipo: 'comunidad',
        titulo: 'Solicitud aprobada',
        mensaje: `Tu solicitud para unirte a ${comunidad.nombre} fue aprobada.`,
        enlace: `/comunidades/${comunidadId}`,
        referencias: { comunidad: comunidadId },
      });

      return { mensaje: 'Solicitud aprobada.' };
    }

    await repositorioMiembroComunidad.eliminar({ comunidad: comunidadId, usuario: usuarioSolicitanteId });
    return { mensaje: 'Solicitud rechazada.' };
  },

  /** Invita a un amigo a la comunidad. */
  async invitarMiembro(comunidadId, usuario, usuarioInvitadoId) {
    const comunidad = await repositorioComunidad.buscarPorId(comunidadId);
    if (!comunidad) throw ErrorAplicacion.noEncontrado('La comunidad no existe.');

    const membresia = await repositorioMiembroComunidad.buscar({ comunidad: comunidadId, usuario: usuario._id });
    if (!membresia || membresia.estado !== 'activo') {
      throw ErrorAplicacion.prohibido('Debes ser miembro de la comunidad para invitar.');
    }

    const bloqueo = await repositorioBloqueo.existeBloqueoEntre(usuario._id, usuarioInvitadoId);
    if (bloqueo) throw ErrorAplicacion.prohibido('No puedes invitar a este usuario.');

    const existente = await repositorioMiembroComunidad.buscar({
      comunidad: comunidadId,
      usuario: usuarioInvitadoId,
    });
    if (existente && existente.estado === 'activo') {
      throw ErrorAplicacion.conflicto('El usuario ya pertenece a la comunidad.');
    }

    if (existente) {
      await repositorioMiembroComunidad.actualizarPorId(existente._id, { estado: 'invitado' });
    } else {
      await repositorioMiembroComunidad.crear({
        comunidad: comunidadId,
        usuario: usuarioInvitadoId,
        estado: 'invitado',
      });
    }

    await servicioNotificacion.crear({
      usuario: usuarioInvitadoId,
      actor: usuario._id,
      tipo: 'comunidad',
      titulo: 'Invitacion a comunidad',
      mensaje: `${usuario.nombres} te invito a unirte a ${comunidad.nombre}.`,
      enlace: `/comunidades/${comunidadId}`,
      referencias: { comunidad: comunidadId },
    });

    return { mensaje: 'Invitacion enviada.' };
  },

  /** Lista las solicitudes pendientes de una comunidad privada. */
  async listarSolicitudes(comunidadId, usuario) {
    const comunidad = await repositorioComunidad.buscarPorId(comunidadId);
    if (!comunidad) throw ErrorAplicacion.noEncontrado('La comunidad no existe.');

    const membresia = await repositorioMiembroComunidad.buscar({ comunidad: comunidadId, usuario: usuario._id });
    const esCreador = String(comunidad.creador._id) === String(usuario._id);
    if (!esCreador && (!membresia || !['administrador', 'moderador'].includes(membresia.rol))) {
      throw ErrorAplicacion.prohibido('No puedes ver las solicitudes de esta comunidad.');
    }

    const solicitudes = await repositorioMiembroComunidad.listarMiembros(comunidadId, { estado: 'pendiente' });
    return { solicitudes };
  },

  async listarMiembros(comunidadId, consulta = {}) {
    const { pagina, limite, saltar } = normalizarPaginacion(consulta, 30, 100);
    const [miembros, total] = await Promise.all([
      repositorioMiembroComunidad.listarMiembros(comunidadId, { saltar, limite }),
      repositorioMiembroComunidad.contarMiembros(comunidadId),
    ]);
    return { miembros, paginacion: metadatosPaginacion(total, pagina, limite) };
  },

  /** Miembro con rol de moderador o administrador expulsa a otro miembro. */
  async expulsarMiembro(comunidadId, usuarioId, miembroId, usuario) {
    const comunidad = await repositorioComunidad.buscarPorId(comunidadId);
    if (!comunidad) throw ErrorAplicacion.noEncontrado('La comunidad no existe.');

    const miMembresia = await repositorioMiembroComunidad.buscar({ comunidad: comunidadId, usuario: usuario._id });
    const esCreador = String(comunidad.creador._id) === String(usuario._id);
    const puedeExpulsar =
      esCreador || (miMembresia && ['administrador', 'moderador'].includes(miMembresia.rol));
    if (!puedeExpulsar) throw ErrorAplicacion.prohibido('No puedes expulsar miembros de esta comunidad.');
    if (String(usuarioId) === String(comunidad.creador._id)) {
      throw ErrorAplicacion.prohibido('No puedes expulsar al creador de la comunidad.');
    }

    await repositorioMiembroComunidad.eliminar({ comunidad: comunidadId, usuario: usuarioId });
    await repositorioComunidad.incrementarCampos(comunidadId, { cantidadMiembros: -1 });
    await repositorioUsuario.incrementarCampos(usuarioId, { cantidadComunidades: -1 });

    return { mensaje: 'Miembro expulsado de la comunidad.' };
  },

  /** Actualiza los datos de la comunidad (solo creador, moderadores o administracion). */
  async actualizarComunidad(comunidadId, usuario, cambios) {
    const comunidad = await repositorioComunidad.buscarPorId(comunidadId);
    if (!comunidad) throw ErrorAplicacion.noEncontrado('La comunidad no existe.');

    const membresia = await repositorioMiembroComunidad.buscar({ comunidad: comunidadId, usuario: usuario._id });
    const esCreador = String(comunidad.creador._id) === String(usuario._id);
    const esAdminPlataforma = esRolAdministracion(usuario.rol);
    if (!esCreador && !esAdminPlataforma && (!membresia || membresia.rol !== 'administrador')) {
      throw ErrorAplicacion.prohibido('No tienes permisos para administrar esta comunidad.');
    }

    const permitidos = ['nombre', 'descripcion', 'imagen', 'portada', 'categoria', 'reglas', 'esPrivada', 'activa'];
    const datosActualizar = {};
    permitidos.forEach((campo) => {
      if (cambios[campo] !== undefined) datosActualizar[campo] = cambios[campo];
    });

    if (Object.keys(datosActualizar).length === 0) {
      throw ErrorAplicacion.solicitudInvalida('No se enviaron cambios para la comunidad.');
    }

    return repositorioComunidad.actualizarPorId(comunidadId, datosActualizar);
  },

  /** Elimina la comunidad con su contenido asociado. */
  async eliminarComunidad(comunidadId, usuario) {
    const comunidad = await repositorioComunidad.buscarPorId(comunidadId);
    if (!comunidad) throw ErrorAplicacion.noEncontrado('La comunidad no existe.');

    const esCreador = String(comunidad.creador._id) === String(usuario._id);
    if (!esCreador && !esRolAdministracion(usuario.rol)) {
      throw ErrorAplicacion.prohibido('Solo el creador o la administracion pueden eliminar la comunidad.');
    }

    const miembros = await repositorioMiembroComunidad.listarMiembros(comunidadId, { limite: 500 });
    await Promise.all(
      miembros.map((miembro) =>
        repositorioUsuario.incrementarCampos(miembro.usuario._id, { cantidadComunidades: -1 })
      )
    );

    await Promise.all([
      repositorioMiembroComunidad.eliminarPorComunidad(comunidadId),
      repositorioPublicacion.eliminarPorComunidad(comunidadId),
      repositorioComunidad.eliminarPorId(comunidadId),
    ]);

    return { mensaje: 'Comunidad eliminada correctamente.' };
  },

  /** Comunidades sugeridas para el panel derecho, excluyendo las del usuario. */
  async sugerirComunidades(usuarioId, limite = 5) {
    const registros = usuarioId
      ? await repositorioMiembroComunidad.listarIdsComunidadesDeUsuario(usuarioId)
      : [];
    return repositorioComunidad.listarSugeridas({
      excluirIds: registros.map((registro) => registro.comunidad),
      limite,
    });
  },

  /** Amigos que aun no pertenecen a la comunidad (para el modal de invitacion). */
  async listarAmigosInvitables(comunidadId, usuarioId) {
    const relaciones = await repositorioAmistad.listarIdsRelacionados(usuarioId, 'aceptada');
    const idsAmigos = relaciones.map((relacion) =>
      String(relacion.solicitante) === String(usuarioId) ? relacion.receptor : relacion.solicitante
    );

    const miembros = await repositorioMiembroComunidad.listarMiembros(comunidadId, { limite: 500 });
    const idsMiembros = new Set(miembros.map((miembro) => String(miembro.usuario._id)));

    const invitables = idsAmigos.filter((id) => !idsMiembros.has(String(id)));
    if (invitables.length === 0) return { amigos: [] };

    const usuarios = await repositorioUsuario.buscarPorIds(invitables);
    return {
      amigos: usuarios.map((usuario) => ({
        _id: usuario._id,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        fotoPerfil: usuario.fotoPerfil,
        carrera: usuario.carrera,
      })),
    };
  },
};

module.exports = { servicioComunidad };
