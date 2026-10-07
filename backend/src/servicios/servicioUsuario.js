const fs = require('fs');
const path = require('path');
const { repositorioUsuario } = require('../repositorios/repositorioUsuario');
const { repositorioPrivacidad } = require('../repositorios/repositorioPrivacidad');
const { repositorioBloqueo } = require('../repositorios/repositorioBloqueo');
const { repositorioAmistad } = require('../repositorios/repositorioAmistad');
const { repositorioPublicacion } = require('../repositorios/repositorioPublicacion');
const { repositorioComentario } = require('../repositorios/repositorioComentario');
const { repositorioMiembroComunidad } = require('../repositorios/repositorioMiembroComunidad');
const { repositorioProducto } = require('../repositorios/repositorioProducto');
const { repositorioNotificacion } = require('../repositorios/repositorioNotificacion');
const { repositorioConversacion } = require('../repositorios/repositorioConversacion');
const { repositorioMensaje } = require('../repositorios/repositorioMensaje');
const { repositorioReaccion } = require('../repositorios/repositorioReaccion');
const { repositorioGuardado } = require('../repositorios/repositorioGuardado');
const { repositorioHistoria } = require('../repositorios/repositorioHistoria');
const { servicioNotificacion } = require('./servicioNotificacion');
const { ErrorAplicacion } = require('../utilidades/ErrorAplicacion');
const { normalizarPaginacion, metadatosPaginacion } = require('../utilidades/paginacion');
const { esRolAdministracion } = require('../constantes/roles');
const { variablesEntorno } = require('../config/variablesEntorno');

/**
 * Servicio de usuarios: perfil publico, edicion, privacidad y bloqueos.
 */
const servicioUsuario = {
  /** Perfil publico de un usuario aplicando sus reglas de privacidad. */
  async obtenerPerfil(usuarioId, solicitanteId = null) {
    const usuario = await repositorioUsuario.buscarPorId(usuarioId);
    if (!usuario || usuario.cuentaEliminada) {
      throw ErrorAplicacion.noEncontrado('El usuario solicitado no existe.');
    }

    const esPropioPerfil = solicitanteId && String(solicitanteId) === String(usuario._id);
    const privacidad = await repositorioPrivacidad.obtenerOCrear(usuario._id);

    // El bloqueo impide ver el perfil completo.
    let bloqueado = false;
    if (solicitanteId && !esPropioPerfil) {
      const bloqueo = await repositorioBloqueo.existeBloqueoEntre(solicitanteId, usuario._id);
      bloqueado = Boolean(bloqueo);
    }

    const datos = usuario.datosPublicos();

    // Solo se muestra el correo si el usuario lo autorizo o es su propio perfil.
    if (!esPropioPerfil && !privacidad?.mostrarCorreo) {
      delete datos.correo;
    }
    if (!esPropioPerfil && privacidad && privacidad.mostrarSemestre === false) {
      delete datos.semestre;
    }

    let amistad = null;
    if (solicitanteId && !esPropioPerfil) {
      const relacion = await repositorioAmistad.buscarEntreDos(solicitanteId, usuario._id);
      if (relacion) {
        amistad = {
          estado: relacion.estado,
          esSolicitante: String(relacion.solicitante) === String(solicitanteId),
        };
      }
    }

    const [cantidadPublicaciones, cantidadComunidades, cantidadAmigos, guardados] = await Promise.all([
      repositorioPublicacion.contarPorAutor(usuario._id),
      repositorioMiembroComunidad.contar({ usuario: usuario._id, estado: 'activo' }),
      repositorioAmistad.contarAceptadas(usuario._id),
      esPropioPerfil ? repositorioGuardado.contar(usuario._id) : Promise.resolve(0),
    ]);

    const puedeVerAmigos =
      esPropioPerfil ||
      (privacidad?.quienPuedeVerAmigos === 'miembros_emi') ||
      (privacidad?.quienPuedeVerAmigos === 'solo_amigos' && amistad && amistad.estado === 'aceptada');

    return {
      usuario: {
        ...datos,
        cantidadPublicaciones,
        cantidadComunidades,
        cantidadAmigos: puedeVerAmigos ? cantidadAmigos : null,
        cantidadGuardados: guardados,
        enLinea: false,
      },
      esPropioPerfil,
      bloqueado,
      amistad,
      privacidad: esPropioPerfil ? privacidad : undefined,
    };
  },

  /** Actualiza los datos editables del perfil. */
  async actualizarPerfil(usuarioId, cambios) {
    const camposPermitidos = [
      'nombres',
      'apellidos',
      'carrera',
      'semestre',
      'unidadAcademica',
      'descripcion',
      'intereses',
      'fotoPerfil',
      'fotoPortada',
      'aceptaNotificacionesCorreo',
    ];

    const datosActualizar = {};
    camposPermitidos.forEach((campo) => {
      if (cambios[campo] !== undefined) datosActualizar[campo] = cambios[campo];
    });

    if (Object.keys(datosActualizar).length === 0) {
      throw ErrorAplicacion.solicitudInvalida('No se enviaron campos para actualizar.');
    }

    // Se eliminan las imagenes anteriores cuando se reemplazan.
    const usuarioActual = await repositorioUsuario.buscarPorId(usuarioId);
    if (!usuarioActual) throw ErrorAplicacion.noEncontrado('El usuario no existe.');

    for (const campo of ['fotoPerfil', 'fotoPortada']) {
      if (datosActualizar[campo] && usuarioActual[campo] && datosActualizar[campo] !== usuarioActual[campo]) {
        this.eliminarArchivoAnterior(usuarioActual[campo]);
      }
    }

    const actualizado = await repositorioUsuario.actualizarPorId(usuarioId, datosActualizar);
    return actualizado.datosPublicos();
  },

  /** Elimina un archivo del disco cuando ya no se usa (sin romper si no existe). */
  eliminarArchivoAnterior(rutaRelativa) {
    try {
      if (!rutaRelativa || !rutaRelativa.startsWith('/uploads/')) return;
      const rutaAbsoluta = path.join(variablesEntorno.archivos.carpetaBase, rutaRelativa.replace('/uploads/', ''));
      if (fs.existsSync(rutaAbsoluta)) fs.unlinkSync(rutaAbsoluta);
    } catch (error) {
      console.warn('[archivos] No se pudo eliminar el archivo anterior:', error.message);
    }
  },

  async obtenerPrivacidad(usuarioId) {
    return repositorioPrivacidad.obtenerOCrear(usuarioId);
  },

  async actualizarPrivacidad(usuarioId, cambios) {
    const camposPermitidos = [
      'visibilidadPerfil',
      'visibilidadPublicaciones',
      'quienPuedeEnviarSolicitudes',
      'quienPuedeEnviarMensajes',
      'quienPuedeVerAmigos',
      'quienPuedeVerComunidades',
      'mostrarCorreo',
      'mostrarSemestre',
      'permitirEtiquetas',
      'aparecerEnBusquedas',
      'recibirNotificaciones',
    ];

    const datosActualizar = {};
    camposPermitidos.forEach((campo) => {
      if (cambios[campo] !== undefined) datosActualizar[campo] = cambios[campo];
    });

    if (Object.keys(datosActualizar).length === 0) {
      throw ErrorAplicacion.solicitudInvalida('No se enviaron cambios de privacidad.');
    }

    return repositorioPrivacidad.actualizar(usuarioId, datosActualizar);
  },

  /** Directorio de usuarios con filtros, excluyendo bloqueos propios. */
  async listarUsuarios(consulta = {}, solicitanteId = null) {
    const { pagina, limite, saltar } = normalizarPaginacion(consulta, 12, 48);
    const filtro = { activo: true, cuentaEliminada: false };

    if (consulta.carrera) filtro.carrera = consulta.carrera;
    if (consulta.semestre) filtro.semestre = Number(consulta.semestre);
    if (consulta.unidadAcademica) filtro.unidadAcademica = consulta.unidadAcademica;
    if (consulta.rol) filtro.rol = consulta.rol;

    // Se excluyen los usuarios bloqueados y quienes bloquearon al solicitante.
    const idsExcluidos = [];
    if (solicitanteId) {
      const [bloqueados, bloqueadores] = await Promise.all([
        repositorioBloqueo.listarBloqueadosPor(solicitanteId),
        repositorioBloqueo.idsQueBloquearon(solicitanteId),
      ]);
      bloqueados.forEach((registro) => idsExcluidos.push(String(registro.bloqueado?._id)));
      bloqueadores.forEach((registro) => idsExcluidos.push(String(registro.quienBloquea)));
    }
    if (idsExcluidos.length > 0) filtro._id = { $nin: idsExcluidos };

    const [usuarios, total] = await Promise.all([
      repositorioUsuario.listar({ filtro, saltar, limite }),
      repositorioUsuario.contar(filtro),
    ]);

    const datos = usuarios.map((usuario) => ({
      _id: usuario._id,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      rol: usuario.rol,
      carrera: usuario.carrera,
      semestre: usuario.semestre,
      unidadAcademica: usuario.unidadAcademica,
      descripcion: usuario.descripcion,
      intereses: usuario.intereses,
      fotoPerfil: usuario.fotoPerfil,
      cantidadAmigos: usuario.cantidadAmigos,
    }));

    return { usuarios: datos, paginacion: metadatosPaginacion(total, pagina, limite) };
  },

  async cambiarRol(usuarioId, nuevoRol, administradorId) {
    if (String(usuarioId) === String(administradorId)) {
      throw ErrorAplicacion.solicitudInvalida('No puedes cambiar tu propio rol.');
    }
    const usuario = await repositorioUsuario.actualizarPorId(usuarioId, { rol: nuevoRol });
    if (!usuario) throw ErrorAplicacion.noEncontrado('El usuario no existe.');
    return usuario.datosPublicos();
  },

  /** Bloquea a un usuario: se elimina la amistad y se cortan las interacciones. */
  async bloquearUsuario(usuarioId, usuarioBloqueadoId, motivo = '') {
    if (String(usuarioId) === String(usuarioBloqueadoId)) {
      throw ErrorAplicacion.solicitudInvalida('No puedes bloquearte a ti mismo.');
    }

    const objetivo = await repositorioUsuario.buscarPorId(usuarioBloqueadoId);
    if (!objetivo) throw ErrorAplicacion.noEncontrado('El usuario que intentas bloquear no existe.');
    if (esRolAdministracion(objetivo.rol)) {
      throw ErrorAplicacion.prohibido('No es posible bloquear a un miembro de la administracion.');
    }

    await repositorioBloqueo.crear({ quienBloquea: usuarioId, bloqueado: usuarioBloqueadoId, motivo });
    await repositorioAmistad.eliminarEntreDos(usuarioId, usuarioBloqueadoId);

    // Se recalcula el contador de amigos de ambos usuarios.
    await this.actualizarContadorAmigos(usuarioId);
    await this.actualizarContadorAmigos(usuarioBloqueadoId);

    return { mensaje: 'Usuario bloqueado correctamente.' };
  },

  async desbloquearUsuario(usuarioId, usuarioBloqueadoId) {
    const eliminado = await repositorioBloqueo.eliminar({
      quienBloquea: usuarioId,
      bloqueado: usuarioBloqueadoId,
    });
    if (!eliminado) throw ErrorAplicacion.noEncontrado('Este usuario no esta bloqueado.');
    return { mensaje: 'Usuario desbloqueado correctamente.' };
  },

  async listarBloqueados(usuarioId) {
    const bloqueos = await repositorioBloqueo.listarBloqueadosPor(usuarioId);
    return bloqueos.map((bloqueo) => ({
      _id: bloqueo._id,
      motivo: bloqueo.motivo,
      fechaCreacion: bloqueo.fechaCreacion,
      usuario: bloqueo.bloqueado,
    }));
  },

  /** Recalcula el contador de amigos de un usuario (mantiene coherencia de datos). */
  async actualizarContadorAmigos(usuarioId) {
    const total = await repositorioAmistad.contarAceptadas(usuarioId);
    await repositorioUsuario.actualizarPorId(usuarioId, { cantidadAmigos: total });
    return total;
  },

  /**
   * Elimina la cuenta del usuario y todos sus datos asociados.
   * Accion administrativa irreversible.
   */
  async eliminarUsuario(usuarioId, administradorId) {
    if (String(usuarioId) === String(administradorId)) {
      throw ErrorAplicacion.solicitudInvalida('No puedes eliminar tu propia cuenta desde el panel.');
    }

    const usuario = await repositorioUsuario.buscarPorId(usuarioId);
    if (!usuario) throw ErrorAplicacion.noEncontrado('El usuario no existe.');

    // Se eliminan las conversaciones del usuario junto con sus mensajes.
    const conversaciones = await repositorioConversacion.listarPorUsuario(usuarioId, { limite: 100 });
    for (const conversacion of conversaciones) {
      await repositorioMensaje.eliminarPorConversacion(conversacion._id);
    }

    // Publicaciones, comentarios y productos creados por el usuario.
    const productos = await repositorioProducto.listarPorVendedor(usuarioId, { limite: 200 });

    await Promise.all([
      repositorioAmistad.eliminarDeUsuario(usuarioId),
      repositorioBloqueo.eliminarTodosDeUsuario(usuarioId),
      repositorioNotificacion.eliminarPorUsuario(usuarioId),
      repositorioHistoria.eliminarDeUsuario(usuarioId),
      repositorioPrivacidad.eliminarPorUsuario(usuarioId),
      repositorioConversacion.eliminarPorUsuario(usuarioId),
      repositorioComentario.eliminarPorAutor(usuarioId),
      repositorioPublicacion.eliminarPorAutor(usuarioId),
      Promise.all(productos.map((producto) => repositorioProducto.eliminarPorId(producto._id))),
    ]);

    await repositorioUsuario.eliminarPorId(usuarioId);

    return { mensaje: `La cuenta de ${usuario.nombres} ${usuario.apellidos} fue eliminada.` };
  },

  /**
   * Desactiva la cuenta del propio usuario.
   * El contenido permanece para no romper conversaciones ni publicaciones compartidas.
   */
  async desactivarCuenta(usuarioId) {
    const usuario = await repositorioUsuario.actualizarPorId(usuarioId, {
      activo: false,
      cuentaEliminada: true,
    });
    if (!usuario) throw ErrorAplicacion.noEncontrado('El usuario no existe.');

    return {
      mensaje:
        'Tu cuenta fue desactivada. Si deseas reactivarla, contacta a la administracion de EMI Connect.',
    };
  },

  /** Recalcula contadores publicos del usuario (usado por tareas internas). */
  async recalcularContadores(usuarioId) {
    const [cantidadPublicaciones, cantidadAmigos, cantidadComunidades] = await Promise.all([
      repositorioPublicacion.contarPorAutor(usuarioId),
      repositorioAmistad.contarAceptadas(usuarioId),
      repositorioMiembroComunidad.contar({ usuario: usuarioId, estado: 'activo' }),
    ]);

    await repositorioUsuario.actualizarPorId(usuarioId, {
      cantidadPublicaciones,
      cantidadAmigos,
      cantidadComunidades,
    });

    return { cantidadPublicaciones, cantidadAmigos, cantidadComunidades };
  },

  /** Reacciones recientes de un usuario (usadas en recomendaciones). */
  async obtenerInteresesDinamicos(usuarioId, limite = 30) {
    const reacciones = await repositorioReaccion.contar({ usuario: usuarioId });
    return { reaccionesTotales: reacciones, limite };
  },
};

module.exports = { servicioUsuario };
