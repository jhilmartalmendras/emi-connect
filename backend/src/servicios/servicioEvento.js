const { repositorioEvento } = require('../repositorios/repositorioEvento');
const { repositorioAsistenciaEvento } = require('../repositorios/repositorioAsistenciaEvento');
const { repositorioMiembroComunidad } = require('../repositorios/repositorioMiembroComunidad');
const { repositorioComunidad } = require('../repositorios/repositorioComunidad');
const { repositorioNotificacion } = require('../repositorios/repositorioNotificacion');
const { servicioNotificacion } = require('./servicioNotificacion');
const { ErrorAplicacion } = require('../utilidades/ErrorAplicacion');
const { normalizarPaginacion, metadatosPaginacion } = require('../utilidades/paginacion');
const { ROLES_CREADORES_EVENTOS, esRolAdministracion } = require('../constantes/roles');
const { ESTADOS_ASISTENCIA } = require('../constantes/catalogos');

const CAMPOS_CONTADOR = {
  interesado: 'cantidadInteresados',
  asistire: 'cantidadAsistentes',
  no_asistire: 'cantidadNoAsistentes',
};

/**
 * Servicio de eventos.
 * Cualquier usuario puede crear eventos; los eventos institucionales requieren
 * un rol autorizado.
 */
const servicioEvento = {
  async crearEvento(usuario, datos) {
    const fecha = new Date(datos.fecha);
    if (Number.isNaN(fecha.getTime())) {
      throw ErrorAplicacion.solicitudInvalida('La fecha del evento no es valida.');
    }

    if (datos.esInstitucional && !ROLES_CREADORES_EVENTOS.includes(usuario.rol)) {
      throw ErrorAplicacion.prohibido('Solo docentes y personal autorizado pueden crear eventos institucionales.');
    }

    if (datos.comunidad) {
      const comunidad = await repositorioComunidad.buscarPorId(datos.comunidad);
      if (!comunidad) throw ErrorAplicacion.noEncontrado('La comunidad indicada no existe.');

      const membresia = await repositorioMiembroComunidad.buscar({
        comunidad: datos.comunidad,
        usuario: usuario._id,
      });
      if (!membresia || membresia.estado !== 'activo') {
        throw ErrorAplicacion.prohibido('Debes ser miembro de la comunidad para crear un evento en ella.');
      }
    }

    const evento = await repositorioEvento.crear({
      nombre: datos.nombre,
      descripcion: datos.descripcion || '',
      fecha,
      horaFin: datos.horaFin ? new Date(datos.horaFin) : null,
      ubicacion: datos.ubicacion || '',
      imagen: datos.imagen || '',
      organizador: usuario._id,
      comunidad: datos.comunidad || null,
      categoria: datos.categoria || 'general',
      cupos: Number(datos.cupos) || 0,
      esInstitucional: Boolean(datos.esInstitucional),
    });

    // El organizador confirma su asistencia automaticamente.
    await repositorioAsistenciaEvento.crearOActualizar({
      evento: evento._id,
      usuario: usuario._id,
      estado: 'asistire',
    });
    await repositorioEvento.incrementarCampos(evento._id, { cantidadAsistentes: 1 });

    // Si el evento pertenece a una comunidad se avisa a sus miembros.
    if (datos.comunidad) {
      const miembros = await repositorioMiembroComunidad.listarMiembros(datos.comunidad, { limite: 200 });
      await Promise.all(
        miembros
          .filter((miembro) => String(miembro.usuario._id) !== String(usuario._id))
          .map((miembro) =>
            servicioNotificacion.crear({
              usuario: miembro.usuario._id,
              actor: usuario._id,
              tipo: 'evento',
              titulo: 'Nuevo evento en tu comunidad',
              mensaje: `Se creo el evento "${datos.nombre}" en una de tus comunidades.`,
              enlace: `/eventos/${evento._id}`,
              referencias: { evento: evento._id, comunidad: datos.comunidad },
            })
          )
      );
    }

    return evento;
  },

  /** Lista de eventos con filtros por rango de fechas y comunidad. */
  async listarEventos(consulta = {}, usuarioId = null) {
    const { pagina, limite, saltar } = normalizarPaginacion(consulta, 12, 48);
    const filtro = {};

    if (consulta.comunidad) filtro.comunidad = consulta.comunidad;
    if (consulta.organizador) filtro.organizador = consulta.organizador;
    if (consulta.esInstitucional === 'true') filtro.esInstitucional = true;
    if (consulta.misEventos === 'true' && usuarioId) {
      const asistencias = await repositorioAsistenciaEvento.listarPorUsuario(usuarioId, { limite: 200 });
      filtro._id = { $in: asistencias.map((asistencia) => asistencia.evento) };
    }
    if (consulta.desde) filtro.fecha = { $gte: new Date(consulta.desde) };
    if (consulta.hasta) filtro.fecha = { ...(filtro.fecha || {}), $lte: new Date(consulta.hasta) };

    const [eventos, total] = await Promise.all([
      repositorioEvento.listar({ filtro, saltar, limite }),
      repositorioEvento.contar(filtro),
    ]);

    return {
      eventos,
      paginacion: metadatosPaginacion(total, pagina, limite),
    };
  },



  /** Detalle del evento con la confirmacion del usuario y la lista de asistentes. */
  async obtenerEvento(id, usuarioId = null) {
    const evento = await repositorioEvento.buscarPorId(id);
    if (!evento || !evento.activo) throw ErrorAplicacion.noEncontrado('El evento no existe o fue cancelado.');

    const asistentes = await repositorioAsistenciaEvento.listarPorEvento(id, { estado: 'asistire', limite: 20 });

    let miAsistencia = null;
    if (usuarioId) {
      const asistencia = await repositorioAsistenciaEvento.buscar({ evento: id, usuario: usuarioId });
      miAsistencia = asistencia ? asistencia.estado : null;
    }

    const esOrganizador = String(evento.organizador._id) === String(usuarioId);

    return {
      evento: { ...evento.toObject(), esOrganizador },
      asistentes: asistentes.map((asistencia) => asistencia.usuario),
      miAsistencia,
    };
  },

  /** Confirma, cambia o retira la asistencia a un evento. */
  async confirmarAsistencia(eventoId, usuario, estado) {
    if (!ESTADOS_ASISTENCIA.includes(estado)) {
      throw ErrorAplicacion.solicitudInvalida('El estado de asistencia no es valido.');
    }

    const evento = await repositorioEvento.buscarPorId(eventoId);
    if (!evento || !evento.activo) throw ErrorAplicacion.noEncontrado('El evento no existe.');
    if (evento.cancelado) throw ErrorAplicacion.solicitudInvalida('El evento fue cancelado.');

    const asistenciaAnterior = await repositorioAsistenciaEvento.buscar({ evento: eventoId, usuario: usuario._id });

    // Control de cupos cuando el estado es "asistire".
    if (estado === 'asistire' && evento.cupos > 0 && (!asistenciaAnterior || asistenciaAnterior.estado !== 'asistire')) {
      const confirmados = await repositorioAsistenciaEvento.contar({ evento: eventoId, estado: 'asistire' });
      if (confirmados >= evento.cupos) {
        throw ErrorAplicacion.conflicto('El evento ya no tiene cupos disponibles.');
      }
    }

    await repositorioAsistenciaEvento.crearOActualizar({ evento: eventoId, usuario: usuario._id, estado });

    // Se corrigen los contadores del evento.
    if (asistenciaAnterior && asistenciaAnterior.estado !== estado) {
      await repositorioEvento.incrementarCampos(eventoId, {
        [CAMPOS_CONTADOR[asistenciaAnterior.estado]]: -1,
        [CAMPOS_CONTADOR[estado]]: 1,
      });
    } else if (!asistenciaAnterior) {
      await repositorioEvento.incrementarCampos(eventoId, { [CAMPOS_CONTADOR[estado]]: 1 });
    }

    if (estado === 'asistire') {
      await servicioNotificacion.crear({
        usuario: evento.organizador._id || evento.organizador,
        actor: usuario._id,
        tipo: 'evento',
        titulo: 'Nueva confirmacion de asistencia',
        mensaje: `${usuario.nombres} confirmo su asistencia a ${evento.nombre}.`,
        enlace: `/eventos/${eventoId}`,
        referencias: { evento: eventoId },
      });
    }

    return { estado, mensaje: 'Asistencia registrada correctamente.' };
  },

  /** Cancela o vuelve a activar un evento (organizador o administracion). */
  async actualizarEvento(eventoId, usuario, cambios) {
    const evento = await repositorioEvento.buscarPorId(eventoId);
    if (!evento) throw ErrorAplicacion.noEncontrado('El evento no existe.');

    const esOrganizador = String(evento.organizador._id) === String(usuario._id);
    if (!esOrganizador && !esRolAdministracion(usuario.rol)) {
      throw ErrorAplicacion.prohibido('Solo el organizador puede editar este evento.');
    }

    const permitidos = [
      'nombre',
      'descripcion',
      'fecha',
      'horaFin',
      'ubicacion',
      'imagen',
      'categoria',
      'cupos',
      'cancelado',
      'esInstitucional',
    ];
    const datosActualizar = {};
    permitidos.forEach((campo) => {
      if (cambios[campo] !== undefined) {
        datosActualizar[campo] = campo === 'fecha' || campo === 'horaFin' ? new Date(cambios[campo]) : cambios[campo];
      }
    });

    if (Object.keys(datosActualizar).length === 0) {
      throw ErrorAplicacion.solicitudInvalida('No se enviaron cambios para el evento.');
    }

    const actualizado = await repositorioEvento.actualizarPorId(eventoId, datosActualizar);

    // Se avisa a los asistentes confirmados cuando el evento se cancela.
    if (datosActualizar.cancelado === true) {
      const asistentes = await repositorioAsistenciaEvento.listarPorEvento(eventoId, {
        estado: 'asistire',
        limite: 200,
      });
      await Promise.all(
        asistentes.map((asistencia) =>
          servicioNotificacion.crear({
            usuario: asistencia.usuario._id,
            actor: usuario._id,
            tipo: 'evento',
            titulo: 'Evento cancelado',
            mensaje: `El evento "${evento.nombre}" fue cancelado.`,
            enlace: `/eventos/${eventoId}`,
            referencias: { evento: eventoId },
          })
        )
      );
    }

    return actualizado;
  },

  async eliminarEvento(eventoId, usuario) {
    const evento = await repositorioEvento.buscarPorId(eventoId);
    if (!evento) throw ErrorAplicacion.noEncontrado('El evento no existe.');

    const esOrganizador = String(evento.organizador._id) === String(usuario._id);
    if (!esOrganizador && !esRolAdministracion(usuario.rol)) {
      throw ErrorAplicacion.prohibido('Solo el organizador o la administracion pueden eliminar el evento.');
    }

    const actualizado = await repositorioEvento.actualizarPorId(eventoId, { activo: false, cancelado: true });
    await repositorioNotificacion.eliminarPorReferencia('referencias.evento', eventoId);

    return { evento: actualizado, mensaje: 'Evento eliminado.' };
  },

  /** Eventos proximos que se muestran en el panel derecho del inicio. */
  listarProximos(limite = 5) {
    return repositorioEvento.listarProximos({ limite });
  },
};

module.exports = { servicioEvento };
