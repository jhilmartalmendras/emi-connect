const { repositorioUsuario } = require('../repositorios/repositorioUsuario');
const { repositorioPublicacion } = require('../repositorios/repositorioPublicacion');
const { repositorioComunidad } = require('../repositorios/repositorioComunidad');
const { repositorioEvento } = require('../repositorios/repositorioEvento');
const { repositorioProducto } = require('../repositorios/repositorioProducto');
const { repositorioBloqueo } = require('../repositorios/repositorioBloqueo');
const { normalizarPaginacion, metadatosPaginacion } = require('../utilidades/paginacion');
const { ErrorAplicacion } = require('../utilidades/ErrorAplicacion');

/**
 * Servicio de busqueda global.
 * Permite buscar en usuarios, publicaciones, comunidades, eventos y productos,
 * con la posibilidad de limitar el resultado a un solo tipo.
 */
const servicioBusqueda = {
  async buscar(usuarioId, consulta = {}) {
    const texto = String(consulta.buscar || consulta.q || '').trim();
    if (texto.length < 2) {
      throw ErrorAplicacion.solicitudInvalida('Ingresa al menos dos caracteres para buscar.');
    }

    const { pagina, limite, saltar } = normalizarPaginacion(consulta, 8, 24);
    const tipo = consulta.tipo || 'todo';

    // Usuarios bloqueados o que bloquearon al solicitante quedan fuera.
    let idsExcluidos = [];
    if (usuarioId) {
      const [bloqueados, bloqueadores] = await Promise.all([
        repositorioBloqueo.listarBloqueadosPor(usuarioId),
        repositorioBloqueo.idsQueBloquearon(usuarioId),
      ]);
      idsExcluidos = [
        ...bloqueados.map((registro) => String(registro.bloqueado?._id)),
        ...bloqueadores.map((registro) => String(registro.quienBloquea)),
      ];
    }

    const filtroUsuarios = { activo: true, cuentaEliminada: false };
    if (idsExcluidos.length > 0) filtroUsuarios._id = { $nin: idsExcluidos };

    const tareas = {
      usuarios: () =>
        repositorioUsuario.buscarPorTexto(texto, { filtro: filtroUsuarios, saltar, limite }).then((usuarios) => ({
          usuarios,
          total: usuarios.length,
        })),
      publicaciones: () =>
        repositorioPublicacion
          .buscarPorTexto(texto, { filtro: {}, saltar, limite })
          .then(async (publicaciones) => ({
            publicaciones,
            total: await repositorioPublicacion.contarBusqueda(texto),
          })),
      comunidades: () =>
        repositorioComunidad
          .buscarPorTexto(texto, { filtro: {}, saltar, limite })
          .then(async (comunidades) => ({
            comunidades,
            total: await repositorioComunidad.contarBusqueda(texto),
          })),
      eventos: () =>
        repositorioEvento
          .buscarPorTexto(texto, { saltar, limite })
          .then(async (eventos) => ({ eventos, total: await repositorioEvento.contarBusqueda(texto) })),
      productos: () =>
        repositorioProducto
          .buscarPorTexto(texto, { saltar, limite })
          .then(async (productos) => ({ productos, total: await repositorioProducto.contarBusqueda(texto) })),
    };

    const resultados = { texto, tipo };

    if (tipo === 'todo') {
      const [usuarios, publicaciones, comunidades, eventos, productos] = await Promise.all([
        tareas.usuarios(),
        tareas.publicaciones(),
        tareas.comunidades(),
        tareas.eventos(),
        tareas.productos(),
      ]);

      Object.assign(resultados, {
        usuarios: usuarios.usuarios,
        publicaciones: publicaciones.publicaciones,
        comunidades: comunidades.comunidades,
        eventos: eventos.eventos,
        productos: productos.productos,
        totales: {
          usuarios: usuarios.total,
          publicaciones: publicaciones.total,
          comunidades: comunidades.total,
          eventos: eventos.total,
          productos: productos.total,
        },
      });
    } else if (tareas[tipo]) {
      const resultado = await tareas[tipo]();
      Object.assign(resultados, resultado, {
        paginacion: metadatosPaginacion(resultado.total, pagina, limite),
      });
    } else {
      throw ErrorAplicacion.solicitudInvalida('El tipo de busqueda no es valido.');
    }

    return resultados;
  },
};

module.exports = { servicioBusqueda };
