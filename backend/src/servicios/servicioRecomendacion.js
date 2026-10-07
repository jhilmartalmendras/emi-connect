const { repositorioUsuario } = require('../repositorios/repositorioUsuario');
const { repositorioComunidad } = require('../repositorios/repositorioComunidad');
const { repositorioEvento } = require('../repositorios/repositorioEvento');
const { repositorioPublicacion } = require('../repositorios/repositorioPublicacion');
const { repositorioAmistad } = require('../repositorios/repositorioAmistad');
const { repositorioMiembroComunidad } = require('../repositorios/repositorioMiembroComunidad');
const { repositorioAsistenciaEvento } = require('../repositorios/repositorioAsistenciaEvento');
const { repositorioBloqueo } = require('../repositorios/repositorioBloqueo');
const { ErrorAplicacion } = require('../utilidades/ErrorAplicacion');

/**
 * Motor de recomendaciones de EMI Connect.
 *
 * Estrategia inicial (sin machine learning): puntuacion por reglas y afinidad.
 *  - +3 si coincide la carrera
 *  - +2 si coincide el semestre
 *  - +2 por cada interes en comun
 *  - +1 por afinidad de comunidad
 *  - +1 por interacciones previas (reacciones y asistencias)
 *
 * La estructura permite reemplazar este motor por un modelo de IA en el futuro
 * sin modificar los controladores: basta con cambiar la implementacion del servicio.
 */
const servicioRecomendacion = {
  /** Calcula el perfil de afinidad del usuario a partir de sus datos. */
  async construirPerfilAfinidad(usuarioId) {
    const usuario = await repositorioUsuario.buscarPorId(usuarioId);
    if (!usuario) throw ErrorAplicacion.noEncontrado('El usuario no existe.');

    const [comunidades, amigos] = await Promise.all([
      repositorioMiembroComunidad.listarIdsComunidadesDeUsuario(usuarioId),
      repositorioAmistad.listarIdsRelacionados(usuarioId, 'aceptada'),
    ]);

    return {
      usuario,
      carrera: usuario.carrera,
      semestre: usuario.semestre,
      intereses: usuario.intereses || [],
      idsComunidades: comunidades.map((registro) => registro.comunidad),
      idsAmigos: amigos.map((relacion) =>
        String(relacion.solicitante) === String(usuarioId) ? relacion.receptor : relacion.solicitante
      ),
    };
  },

  /** Usuarios recomendados por carrera, semestre e intereses. */
  async recomendarUsuarios(usuarioId, limite = 5) {
    const perfil = await this.construirPerfilAfinidad(usuarioId);
    const idsExcluidos = [
      String(usuarioId),
      ...perfil.idsAmigos.map(String),
    ];

    // Se excluyen usuarios bloqueados o que bloquearon al usuario.
    const bloqueos = await repositorioBloqueo.listarBloqueadosPor(usuarioId);
    const bloqueadores = await repositorioBloqueo.idsQueBloquearon(usuarioId);
    idsExcluidos.push(
      ...bloqueos.map((registro) => String(registro.bloqueado?._id)),
      ...bloqueadores.map((registro) => String(registro.quienBloquea))
    );

    const candidatos = await repositorioUsuario.listarSugeridos({
      excluirIds: idsExcluidos,
      carrera: perfil.carrera,
      intereses: perfil.intereses,
      limite: limite * 4,
    });

    const puntuados = candidatos.map((candidato) => {
      let puntaje = 0;
      if (perfil.carrera && candidato.carrera === perfil.carrera) puntaje += 3;
      if (perfil.semestre && candidato.semestre === perfil.semestre) puntaje += 2;
      const coincidencias = (candidato.intereses || []).filter((interes) =>
        perfil.intereses.includes(interes)
      ).length;
      puntaje += coincidencias * 2;
      puntaje += Math.min(candidato.cantidadAmigos || 0, 10) * 0.1;

      return {
        puntaje,
        motivos: [
          perfil.carrera && candidato.carrera === perfil.carrera ? 'Misma carrera' : null,
          perfil.semestre && candidato.semestre === perfil.semestre ? 'Mismo semestre' : null,
          coincidencias > 0 ? `${coincidencias} interes(es) en comun` : null,
        ].filter(Boolean),
        usuario: {
          _id: candidato._id,
          nombres: candidato.nombres,
          apellidos: candidato.apellidos,
          carrera: candidato.carrera,
          semestre: candidato.semestre,
          fotoPerfil: candidato.fotoPerfil,
          intereses: candidato.intereses,
          cantidadAmigos: candidato.cantidadAmigos,
        },
      };
    });

    return puntuados.sort((a, b) => b.puntaje - a.puntaje).slice(0, limite);
  },

  /** Comunidades recomendadas segun intereses, carrera y actividad. */
  async recomendarComunidades(usuarioId, limite = 4) {
    const perfil = await this.construirPerfilAfinidad(usuarioId);
    const yaMiembro = perfil.idsComunidades.map(String);

    const comunidades = await repositorioComunidad.listarSugeridas({
      excluirIds: yaMiembro,
      limite: limite * 3,
    });

    const puntuados = comunidades
      .filter((comunidad) => !yaMiembro.includes(String(comunidad._id)))
      .map((comunidad) => {
        const texto = `${comunidad.nombre} ${comunidad.categoria}`.toLowerCase();
        const coincidencias = perfil.intereses.filter((interes) =>
          texto.includes(String(interes).toLowerCase().split(' ')[0])
        ).length;

        let puntaje = coincidencias * 3;
        puntaje += Math.min(comunidad.cantidadMiembros || 0, 50) * 0.1;
        if (perfil.carrera && comunidad.nombre.toLowerCase().includes(perfil.carrera.toLowerCase().split(' ').pop())) {
          puntaje += 2;
        }

        return {
          puntaje: Number(puntaje.toFixed(2)),
          motivos: coincidencias > 0 ? ['Coincide con tus intereses'] : ['Comunidad activa'],
          comunidad,
        };
      });

    return puntuados.sort((a, b) => b.puntaje - a.puntaje).slice(0, limite);
  },

  /** Eventos recomendados: proximos, de las comunidades del usuario o de su interes. */
  async recomendarEventos(usuarioId, limite = 4) {
    const perfil = await this.construirPerfilAfinidad(usuarioId);
    const asistencias = await repositorioAsistenciaEvento.listarPorUsuario(usuarioId, { limite: 100 });
    const idsConAsistencia = asistencias.map((asistencia) => String(asistencia.evento));

    const eventos = await repositorioEvento.listarProximos({ limite: limite * 4 });

    const puntuados = eventos
      .filter((evento) => !idsConAsistencia.includes(String(evento._id)))
      .map((evento) => {
        let puntaje = 0;
        const motivos = [];

        if (evento.comunidad && perfil.idsComunidades.map(String).includes(String(evento.comunidad._id))) {
          puntaje += 4;
          motivos.push('De una de tus comunidades');
        }
        const texto = `${evento.nombre} ${evento.descripcion}`.toLowerCase();
        const coincidencias = perfil.intereses.filter((interes) =>
          texto.includes(String(interes).toLowerCase().split(' ')[0])
        ).length;
        if (coincidencias > 0) {
          puntaje += coincidencias * 2;
          motivos.push('Relacionado con tus intereses');
        }
        if (evento.esInstitucional) {
          puntaje += 1;
          motivos.push('Evento institucional');
        }

        return { puntaje, motivos: motivos.length > 0 ? motivos : ['Evento proximo'], evento };
      });

    return puntuados.sort((a, b) => b.puntaje - a.puntaje).slice(0, limite);
  },

  /** Publicaciones recomendadas segun intereses y actividad de la comunidad. */
  async recomendarPublicaciones(usuarioId, limite = 4) {
    const perfil = await this.construirPerfilAfinidad(usuarioId);

    const publicaciones = await repositorioPublicacion.listar({
      filtro: {
        autor: { $nin: [String(usuarioId), ...perfil.idsAmigos.map(String)] },
      },
      limite: limite * 6,
    });

    const puntuados = publicaciones.map((publicacion) => {
      const texto = `${publicacion.contenido} ${(publicacion.etiquetas || []).join(' ')}`.toLowerCase();
      let puntaje = 0;
      const motivos = [];

      const coincidencias = perfil.intereses.filter((interes) =>
        texto.includes(String(interes).toLowerCase().split(' ')[0])
      ).length;
      if (coincidencias > 0) {
        puntaje += coincidencias * 3;
        motivos.push('Coincide con tus intereses');
      }
      const reaccionesTotales = Object.values(publicacion.reaccionesResumen || {}).reduce(
        (acumulado, valor) => acumulado + (valor || 0),
        0
      );
      puntaje += Math.min(reaccionesTotales, 20) * 0.15;
      if (publicacion.categoria === 'academica' || publicacion.categoria === 'institucional') {
        puntaje += 1;
        motivos.push('Contenido academico o institucional');
      }
      if (perfil.idsComunidades.map(String).includes(String(publicacion.comunidad))) {
        puntaje += 2;
        motivos.push('De una de tus comunidades');
      }

      return { puntaje: Number(puntaje.toFixed(2)), motivos, publicacion };
    });

    return puntuados
      .sort((a, b) => b.puntaje - a.puntaje)
      .slice(0, limite)
      .map((elemento) => ({ ...elemento, motivos: elemento.motivos.length ? elemento.motivos : ['Contenido popular'] }));
  },

  /** Panel completo de recomendaciones que se muestra en la pagina de inicio. */
  async obtenerRecomendaciones(usuarioId, limites = {}) {
    const [usuarios, comunidades, eventos, publicaciones] = await Promise.all([
      this.recomendarUsuarios(usuarioId, limites.usuarios || 5),
      this.recomendarComunidades(usuarioId, limites.comunidades || 4),
      this.recomendarEventos(usuarioId, limites.eventos || 4),
      this.recomendarPublicaciones(usuarioId, limites.publicaciones || 4),
    ]);

    return { usuarios, comunidades, eventos, publicaciones };
  },
};

module.exports = { servicioRecomendacion };
