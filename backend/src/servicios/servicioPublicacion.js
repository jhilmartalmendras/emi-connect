const { repositorioPublicacion } = require('../repositorios/repositorioPublicacion');
const { repositorioUsuario } = require('../repositorios/repositorioUsuario');
const { repositorioAmistad } = require('../repositorios/repositorioAmistad');
const { repositorioComunidad } = require('../repositorios/repositorioComunidad');
const { repositorioMiembroComunidad } = require('../repositorios/repositorioMiembroComunidad');
const { repositorioBloqueo } = require('../repositorios/repositorioBloqueo');
const { repositorioReaccion } = require('../repositorios/repositorioReaccion');
const { repositorioGuardado } = require('../repositorios/repositorioGuardado');
const { repositorioHistoria } = require('../repositorios/repositorioHistoria');
const { repositorioPrivacidad } = require('../repositorios/repositorioPrivacidad');
const { servicioNotificacion } = require('./servicioNotificacion');
const { ErrorAplicacion } = require('../utilidades/ErrorAplicacion');
const { normalizarPaginacion, metadatosPaginacion } = require('../utilidades/paginacion');
const { sumarHoras } = require('../utilidades/fechas');
const { puedePublicarInstitucional, esRolAdministracion } = require('../constantes/roles');
const { CATEGORIAS_PUBLICACION } = require('../constantes/catalogos');

/**
 * Servicio de publicaciones.
 * Agrupa el feed, la creacion de contenido, las publicaciones compartidas,
 * las publicaciones guardadas y las historias de 24 horas.
 */
const servicioPublicacion = {
  /**
   * Agrega a cada publicacion la reaccion del usuario y si esta guardada.
   * Se resuelve con dos consultas en bloque para evitar el problema N+1.
   */
  async enriquecerPublicaciones(publicaciones, usuarioId) {
    if (!publicaciones || publicaciones.length === 0) return [];

    if (!usuarioId) {
      return publicaciones.map((publicacion) => ({ ...publicacion, miReaccion: null, guardada: false }));
    }

    const ids = publicaciones.map((publicacion) => publicacion._id);
    const [reacciones, guardados] = await Promise.all([
      repositorioReaccion.listarDeUsuarioEnObjetivos(usuarioId, ids),
      repositorioGuardado.listarIdsPublicaciones(usuarioId),
    ]);

    const mapaReacciones = new Map(reacciones.map((reaccion) => [String(reaccion.objetivo), reaccion.tipo]));
    const setGuardadas = new Set(guardados.map((registro) => String(registro.publicacion)));

    return publicaciones.map((publicacion) => ({
      ...publicacion,
      miReaccion: mapaReacciones.get(String(publicacion._id)) || null,
      guardada: setGuardadas.has(String(publicacion._id)),
    }));
  },

  /** Crea una publicacion validando permisos de categoria y comunidad. */
  async crearPublicacion(usuario, datos) {
    const categoria = datos.categoria || 'general';

    if (!CATEGORIAS_PUBLICACION.includes(categoria)) {
      throw ErrorAplicacion.solicitudInvalida('La categoria de la publicacion no es valida.');
    }

    if (categoria === 'institucional' && !puedePublicarInstitucional(usuario.rol)) {
      throw ErrorAplicacion.prohibido('Solo docentes y personal autorizado pueden publicar contenido institucional.');
    }
    if (categoria === 'academica' && usuario.rol === 'estudiante' && !datos.permitirAcademica) {
      // Los estudiantes pueden publicar contenido academico, pero queda marcado como no oficial.
      datos.esOficialAcademico = false;
    }

    if (!datos.contenido && (!datos.imagenes || datos.imagenes.length === 0) && !datos.publicacionOriginal) {
      throw ErrorAplicacion.solicitudInvalida('La publicacion debe tener texto, imagenes o contenido compartido.');
    }

    // Si la publicacion pertenece a una comunidad, el usuario debe ser miembro activo.
    if (datos.comunidad) {
      const comunidad = await repositorioComunidad.buscarPorId(datos.comunidad);
      if (!comunidad) throw ErrorAplicacion.noEncontrado('La comunidad indicada no existe.');

      const membresia = await repositorioMiembroComunidad.buscar({
        comunidad: datos.comunidad,
        usuario: usuario._id,
      });
      if (!membresia || membresia.estado !== 'activo') {
        throw ErrorAplicacion.prohibido('Debes ser miembro de la comunidad para publicar en ella.');
      }
    }

    const publicacion = await repositorioPublicacion.crear({
      autor: usuario._id,
      contenido: datos.contenido || '',
      imagenes: datos.imagenes || [],
      enlace: datos.enlace || { url: '', titulo: '' },
      categoria,
      esInstitucional: categoria === 'institucional',
      comunidad: datos.comunidad || null,
      evento: datos.evento || null,
      producto: datos.producto || null,
      etiquetas: datos.etiquetas || [],
    });

    await repositorioUsuario.incrementarCampos(usuario._id, { cantidadPublicaciones: 1 });
    if (datos.comunidad) {
      await repositorioComunidad.incrementarCampos(datos.comunidad, { cantidadPublicaciones: 1 });
    }

    return this.enriquecerPublicaciones([publicacion.toObject()], usuario._id).then((lista) => lista[0]);
  },

  /** Feed principal: publicaciones propias, de amigos y de comunidades del usuario. */
  async obtenerFeed(usuarioId, consulta = {}) {
    const { pagina, limite, saltar } = normalizarPaginacion(consulta, 10, 30);

    const [idsAmigos, idsComunidades, bloqueadores] = await Promise.all([
      repositorioAmistad.listarIdsRelacionados(usuarioId, 'aceptada').then((relaciones) =>
        relaciones.map((relacion) =>
          String(relacion.solicitante) === String(usuarioId) ? relacion.receptor : relacion.solicitante
        )
      ),
      repositorioMiembroComunidad.listarIdsComunidadesDeUsuario(usuarioId).then((registros) =>
        registros.map((registro) => registro.comunidad)
      ),
      repositorioBloqueo.idsQueBloquearon(usuarioId).then((registros) =>
        registros.map((registro) => registro.quienBloquea)
      ),
    ]);

    const autoresIds = [...idsAmigos.map(String), String(usuarioId)];
    const filtroCategoria = consulta.categoria ? { categoria: consulta.categoria } : {};

    let publicaciones;
    let total;

    if (consulta.categoria === 'institucional') {
      [publicaciones, total] = await Promise.all([
        repositorioPublicacion.listar({
          filtro: { ...filtroCategoria, esInstitucional: true },
          saltar,
          limite,
        }),
        repositorioPublicacion.contar({ esInstitucional: true }),
      ]);
    } else {
      [publicaciones, total] = await Promise.all([
        repositorioPublicacion.listarFeed({
          usuariosIds: autoresIds,
          comunidadesIds: idsComunidades,
          saltar,
          limite,
        }),
        repositorioPublicacion.contarFeed({ usuariosIds: autoresIds, comunidadesIds: idsComunidades }),
      ]);
    }

    // Nunca se muestran publicaciones de usuarios bloqueados.
    const idsBloqueadores = new Set(bloqueadores.map(String));
    const visibles = publicaciones.filter(
      (publicacion) => !publicacion.autor || !idsBloqueadores.has(String(publicacion.autor._id || publicacion.autor))
    );

    return {
      publicaciones: await this.enriquecerPublicaciones(visibles, usuarioId),
      paginacion: metadatosPaginacion(total, pagina, limite),
    };
  },

  /** Publicaciones de un perfil, respetando la privacidad del autor. */
  async listarPorUsuario(perfilId, solicitanteId, consulta = {}) {
    const { pagina, limite, saltar } = normalizarPaginacion(consulta, 10, 30);
    const esPropioPerfil = String(solicitanteId) === String(perfilId);

    if (!esPropioPerfil && solicitanteId) {
      const privacidad = await repositorioPrivacidad.obtenerOCrear(perfilId);
      if (privacidad?.visibilidadPublicaciones === 'solo_amigos') {
        const amistad = await repositorioAmistad.buscarEntreDos(solicitanteId, perfilId);
        if (!amistad || amistad.estado !== 'aceptada') {
          throw ErrorAplicacion.prohibido('Este usuario comparte sus publicaciones solo con sus contactos.');
        }
      } else if (privacidad?.visibilidadPublicaciones === 'limitado' && !esPropioPerfil) {
        const amistad = await repositorioAmistad.buscarEntreDos(solicitanteId, perfilId);
        if (!amistad || amistad.estado !== 'aceptada') {
          // Perfil limitado: solo se muestran publicaciones institucionales.
          const [publicaciones, total] = await Promise.all([
            repositorioPublicacion.listar({
              filtro: { autor: perfilId, esInstitucional: true },
              saltar,
              limite,
            }),
            repositorioPublicacion.contar({ autor: perfilId, esInstitucional: true }),
          ]);
          return {
            publicaciones: await this.enriquecerPublicaciones(publicaciones, solicitanteId),
            paginacion: metadatosPaginacion(total, pagina, limite),
          };
        }
      }
    }

    const [publicaciones, total] = await Promise.all([
      repositorioPublicacion.listarPorAutor(perfilId, { saltar, limite }),
      repositorioPublicacion.contarPorAutor(perfilId),
    ]);

    return {
      publicaciones: await this.enriquecerPublicaciones(publicaciones, solicitanteId),
      paginacion: metadatosPaginacion(total, pagina, limite),
    };
  },

  async listarPorComunidad(comunidadId, solicitanteId, consulta = {}) {
    const { pagina, limite, saltar } = normalizarPaginacion(consulta, 10, 30);
    const [publicaciones, total] = await Promise.all([
      repositorioPublicacion.listarPorComunidad(comunidadId, { saltar, limite }),
      repositorioPublicacion.contar({ comunidad: comunidadId }),
    ]);

    return {
      publicaciones: await this.enriquecerPublicaciones(publicaciones, solicitanteId),
      paginacion: metadatosPaginacion(total, pagina, limite),
    };
  },

  /** Detalle de una publicacion. */
  async obtenerPublicacion(id, solicitanteId) {
    const publicacion = await repositorioPublicacion.buscarPorId(id);
    if (!publicacion || publicacion.eliminado) {
      throw ErrorAplicacion.noEncontrado('La publicacion no existe o fue eliminada.');
    }

    if (solicitanteId) {
      const bloqueo = await repositorioBloqueo.existeBloqueoEntre(
        solicitanteId,
        publicacion.autor._id || publicacion.autor
      );
      if (bloqueo) throw ErrorAplicacion.prohibido('No puedes ver esta publicacion.');
    }

    const [enriquecida] = await this.enriquecerPublicaciones([publicacion.toObject()], solicitanteId);
    return enriquecida;
  },

  /** Edita el contenido de una publicacion propia. */
  async actualizarPublicacion(id, usuario, cambios) {
    const publicacion = await repositorioPublicacion.buscarPorId(id, false);
    if (!publicacion || publicacion.eliminado) throw ErrorAplicacion.noEncontrado('La publicacion no existe.');

    const esAutor = String(publicacion.autor) === String(usuario._id);
    if (!esAutor && !esRolAdministracion(usuario.rol)) {
      throw ErrorAplicacion.prohibido('Solo el autor puede editar esta publicacion.');
    }

    const datosActualizar = {};
    if (cambios.contenido !== undefined) datosActualizar.contenido = cambios.contenido;
    if (cambios.imagenes !== undefined) datosActualizar.imagenes = cambios.imagenes;
    if (cambios.categoria !== undefined) {
      if (!CATEGORIAS_PUBLICACION.includes(cambios.categoria)) {
        throw ErrorAplicacion.solicitudInvalida('La categoria no es valida.');
      }
      if (cambios.categoria === 'institucional' && !puedePublicarInstitucional(usuario.rol)) {
        throw ErrorAplicacion.prohibido('No tienes permisos para publicar contenido institucional.');
      }
      datosActualizar.categoria = cambios.categoria;
      datosActualizar.esInstitucional = cambios.categoria === 'institucional';
    }
    if (cambios.etiquetas !== undefined) datosActualizar.etiquetas = cambios.etiquetas;
    datosActualizar.editado = true;

    const actualizada = await repositorioPublicacion.actualizarPorId(id, datosActualizar);
    return actualizada;
  },

  /** Elimina (logicamente) una publicacion: autor o administracion. */
  async eliminarPublicacion(id, usuario, motivo = '') {
    const publicacion = await repositorioPublicacion.buscarPorId(id, false);
    if (!publicacion || publicacion.eliminado) throw ErrorAplicacion.noEncontrado('La publicacion no existe.');

    const esAutor = String(publicacion.autor) === String(usuario._id);
    if (!esAutor && !esRolAdministracion(usuario.rol)) {
      throw ErrorAplicacion.prohibido('No tienes permisos para eliminar esta publicacion.');
    }

    await repositorioPublicacion.marcarEliminada(id, { eliminadoPor: usuario._id, motivo });
    await repositorioGuardado.eliminarPorPublicacion(id);

    if (esAutor) {
      await repositorioUsuario.incrementarCampos(publicacion.autor, { cantidadPublicaciones: -1 });
      if (publicacion.comunidad) {
        await repositorioComunidad.incrementarCampos(publicacion.comunidad, { cantidadPublicaciones: -1 });
      }
    }

    return { mensaje: 'Publicacion eliminada correctamente.' };
  },

  /** Restaura una publicacion eliminada (solo administracion). */
  async restaurarPublicacion(id, usuario) {
    if (!esRolAdministracion(usuario.rol)) {
      throw ErrorAplicacion.prohibido('Solo la administracion puede restaurar publicaciones.');
    }
    const publicacion = await repositorioPublicacion.restaurar(id);
    if (!publicacion) throw ErrorAplicacion.noEncontrado('La publicacion no existe.');
    return publicacion;
  },

  /** Comparte una publicacion manteniendo la referencia al contenido original. */
  async compartirPublicacion(idOriginal, usuario, comentario = '') {
    const original = await repositorioPublicacion.buscarPorId(idOriginal);
    if (!original || original.eliminado) {
      throw ErrorAplicacion.noEncontrado('La publicacion que intentas compartir no existe.');
    }

    // Si ya es una publicacion compartida, se referencia siempre la original.
    const idReferencia = original.publicacionOriginal
      ? original.publicacionOriginal._id || original.publicacionOriginal
      : original._id;

    const nueva = await repositorioPublicacion.crear({
      autor: usuario._id,
      contenido: comentario,
      categoria: original.categoria,
      esInstitucional: false,
      publicacionOriginal: idReferencia,
    });

    await Promise.all([
      repositorioPublicacion.incrementarCampos(idReferencia, { cantidadCompartidos: 1 }),
      repositorioUsuario.incrementarCampos(usuario._id, { cantidadPublicaciones: 1 }),
    ]);

    const autorOriginalId = original.autor._id || original.autor;
    await servicioNotificacion.crear({
      usuario: autorOriginalId,
      actor: usuario._id,
      tipo: 'reaccion',
      titulo: 'Compartieron tu publicacion',
      mensaje: `${usuario.nombres} compartio tu publicacion.`,
      enlace: `/publicacion/${idReferencia}`,
      referencias: { publicacion: idReferencia },
    });

    return this.obtenerPublicacion(nueva._id, usuario._id);
  },

  /** Guarda o quita una publicacion de la lista de guardados. */
  async alternarGuardado(publicacionId, usuarioId) {
    const publicacion = await repositorioPublicacion.buscarPorId(publicacionId, false);
    if (!publicacion || publicacion.eliminado) throw ErrorAplicacion.noEncontrado('La publicacion no existe.');

    const existente = await repositorioGuardado.buscar({ usuario: usuarioId, publicacion: publicacionId });

    if (existente) {
      await repositorioGuardado.eliminar({ usuario: usuarioId, publicacion: publicacionId });
      await repositorioPublicacion.incrementarCampos(publicacionId, { cantidadGuardados: -1 });
      return { guardada: false, mensaje: 'Publicacion quitada de guardados.' };
    }

    await repositorioGuardado.crear({ usuario: usuarioId, publicacion: publicacionId });
    await repositorioPublicacion.incrementarCampos(publicacionId, { cantidadGuardados: 1 });
    return { guardada: true, mensaje: 'Publicacion guardada correctamente.' };
  },

  async listarGuardadas(usuarioId, consulta = {}) {
    const { pagina, limite, saltar } = normalizarPaginacion(consulta, 10, 30);
    const registros = await repositorioGuardado.listarPorUsuario(usuarioId, { saltar, limite });
    const ids = registros.map((registro) => registro.publicacion);

    if (ids.length === 0) {
      return { publicaciones: [], paginacion: metadatosPaginacion(0, pagina, limite) };
    }

    const [publicaciones, total] = await Promise.all([
      repositorioPublicacion.listarGuardadas(ids, { limite: ids.length }),
      repositorioGuardado.contar(usuarioId),
    ]);

    return {
      publicaciones: await this.enriquecerPublicaciones(publicaciones, usuarioId),
      paginacion: metadatosPaginacion(total, pagina, limite),
    };
  },

  // ------------------------------------------------------------------
  // HISTORIAS (expiran automaticamente despues de 24 horas)
  // ------------------------------------------------------------------

  async crearHistoria(usuarioId, { texto = '', imagen = '', colorFondo = '#0b2039' }) {
    if (!texto && !imagen) {
      throw ErrorAplicacion.solicitudInvalida('La historia debe tener texto o imagen.');
    }

    const historia = await repositorioHistoria.crear({
      autor: usuarioId,
      texto,
      imagen,
      colorFondo,
      expiraEn: sumarHoras(24),
    });

    return historia;
  },

  /** Historias activas del usuario y sus amigos, agrupadas por autor. */
  async listarHistorias(usuarioId) {
    const idsAmigos = await repositorioAmistad.listarIdsRelacionados(usuarioId, 'aceptada').then((relaciones) =>
      relaciones.map((relacion) =>
        String(relacion.solicitante) === String(usuarioId) ? relacion.receptor : relacion.solicitante
      )
    );

    const autores = [...idsAmigos.map(String), String(usuarioId)];
    const historias = await repositorioHistoria.listarActivasDe(autores);

    // Se agrupan por autor para que la interfaz muestre un carrusel por persona.
    const agrupadas = new Map();
    historias.forEach((historia) => {
      const autorId = String(historia.autor._id);
      if (!agrupadas.has(autorId)) {
        agrupadas.set(autorId, { autor: historia.autor, historias: [], vista: true });
      }
      const grupo = agrupadas.get(autorId);
      grupo.historias.push(historia);
      if (!historia.visualizaciones.some((id) => String(id) === String(usuarioId))) {
        grupo.vista = false;
      }
    });

    return Array.from(agrupadas.values());
  },

  async registrarVisualizacionHistoria(historiaId, usuarioId) {
    const historia = await repositorioHistoria.buscarPorId(historiaId);
    if (!historia) throw ErrorAplicacion.noEncontrado('La historia ya no esta disponible.');
    await repositorioHistoria.registrarVisualizacion(historiaId, usuarioId);
    return { mensaje: 'Visualizacion registrada.' };
  },

  async eliminarHistoria(historiaId, usuarioId) {
    const historia = await repositorioHistoria.buscarPorId(historiaId);
    if (!historia) throw ErrorAplicacion.noEncontrado('La historia no existe.');
    if (String(historia.autor._id) !== String(usuarioId)) {
      throw ErrorAplicacion.prohibido('Solo el autor puede eliminar su historia.');
    }
    await repositorioHistoria.eliminarPorId(historiaId);
    return { mensaje: 'Historia eliminada.' };
  },
};

module.exports = { servicioPublicacion };
