const { repositorioProducto } = require('../repositorios/repositorioProducto');
const { repositorioUsuario } = require('../repositorios/repositorioUsuario');
const { repositorioBloqueo } = require('../repositorios/repositorioBloqueo');
const { servicioNotificacion } = require('./servicioNotificacion');
const { ErrorAplicacion } = require('../utilidades/ErrorAplicacion');
const { normalizarPaginacion, metadatosPaginacion } = require('../utilidades/paginacion');
const { CATEGORIAS_PRODUCTO, ESTADOS_PRODUCTO } = require('../constantes/catalogos');
const { esRolAdministracion } = require('../constantes/roles');

/**
 * Servicio del Marketplace EMI.
 * Compra y venta interna sin pagos en linea: el contacto se realiza por mensajeria.
 */
const servicioProducto = {
  async crearProducto(usuario, datos) {
    if (!CATEGORIAS_PRODUCTO.includes(datos.categoria || 'otros')) {
      throw ErrorAplicacion.solicitudInvalida('La categoria del producto no es valida.');
    }

    return repositorioProducto.crear({
      vendedor: usuario._id,
      titulo: datos.titulo,
      descripcion: datos.descripcion || '',
      precio: Number(datos.precio),
      moneda: datos.moneda || 'BOB',
      esNegociable: datos.esNegociable !== undefined ? Boolean(datos.esNegociable) : true,
      categoria: datos.categoria || 'otros',
      imagenes: datos.imagenes || [],
      ubicacion: datos.ubicacion || '',
      estado: 'disponible',
    });
  },

  /** Listado con filtros por categoria, estado, precio y texto. */
  async listarProductos(consulta = {}, usuarioId = null) {
    const { pagina, limite, saltar } = normalizarPaginacion(consulta, 12, 48);
    const filtro = {};

    if (consulta.categoria) filtro.categoria = consulta.categoria;
    if (consulta.estado) filtro.estado = consulta.estado;
    if (consulta.vendedor) filtro.vendedor = consulta.vendedor;
    if (consulta.precioMinimo || consulta.precioMaximo) {
      filtro.precio = {};
      if (consulta.precioMinimo) filtro.precio.$gte = Number(consulta.precioMinimo);
      if (consulta.precioMaximo) filtro.precio.$lte = Number(consulta.precioMaximo);
    }
    if (consulta.buscar) {
      const resultado = await repositorioProducto.buscarPorTexto(consulta.buscar, { filtro, saltar, limite });
      return {
        productos: resultado,
        paginacion: metadatosPaginacion(
          await repositorioProducto.contarBusqueda(consulta.buscar, filtro),
          pagina,
          limite
        ),
      };
    }

    const orden =
      consulta.orden === 'precio_asc'
        ? { precio: 1 }
        : consulta.orden === 'precio_desc'
        ? { precio: -1 }
        : { fechaCreacion: -1 };

    const [productos, total] = await Promise.all([
      repositorioProducto.listar({ filtro, saltar, limite, orden }),
      repositorioProducto.contar(filtro),
    ]);

    return { productos, paginacion: metadatosPaginacion(total, pagina, limite) };
  },

  /** Detalle del producto con incremento de visitas. */
  async obtenerProducto(id, usuarioId = null) {
    const producto = await repositorioProducto.buscarPorId(id);
    if (!producto || !producto.activo) throw ErrorAplicacion.noEncontrado('El producto no existe o fue retirado.');

    // Se cuenta la visita salvo que el visitante sea el vendedor.
    if (!usuarioId || String(producto.vendedor._id) !== String(usuarioId)) {
      await repositorioProducto.incrementarCampos(id, { vistas: 1 });
      producto.vistas += 1;
    }

    if (usuarioId) {
      const bloqueo = await repositorioBloqueo.existeBloqueoEntre(usuarioId, producto.vendedor._id);
      if (bloqueo) throw ErrorAplicacion.prohibido('No puedes ver este producto.');
    }

    return {
      producto: {
        ...producto.toObject(),
        esMio: usuarioId ? String(producto.vendedor._id) === String(usuarioId) : false,
      },
    };
  },

  async listarMisProductos(usuarioId, consulta = {}) {
    const { pagina, limite, saltar } = normalizarPaginacion(consulta, 12, 48);
    const [productos, total] = await Promise.all([
      repositorioProducto.listarPorVendedor(usuarioId, { saltar, limite }),
      repositorioProducto.contarPorVendedor(usuarioId),
    ]);
    return { productos, paginacion: metadatosPaginacion(total, pagina, limite) };
  },

  async actualizarProducto(id, usuario, cambios) {
    const producto = await repositorioProducto.buscarPorId(id);
    if (!producto) throw ErrorAplicacion.noEncontrado('El producto no existe.');

    const esVendedor = String(producto.vendedor._id) === String(usuario._id);
    if (!esVendedor && !esRolAdministracion(usuario.rol)) {
      throw ErrorAplicacion.prohibido('Solo el vendedor puede editar este producto.');
    }

    const permitidos = [
      'titulo',
      'descripcion',
      'precio',
      'moneda',
      'esNegociable',
      'categoria',
      'imagenes',
      'ubicacion',
      'estado',
      'activo',
    ];
    const datosActualizar = {};
    permitidos.forEach((campo) => {
      if (cambios[campo] !== undefined) datosActualizar[campo] = cambios[campo];
    });

    if (datosActualizar.categoria && !CATEGORIAS_PRODUCTO.includes(datosActualizar.categoria)) {
      throw ErrorAplicacion.solicitudInvalida('La categoria del producto no es valida.');
    }
    if (datosActualizar.estado && !ESTADOS_PRODUCTO.includes(datosActualizar.estado)) {
      throw ErrorAplicacion.solicitudInvalida('El estado del producto no es valido.');
    }
    if (Object.keys(datosActualizar).length === 0) {
      throw ErrorAplicacion.solicitudInvalida('No se enviaron cambios para el producto.');
    }

    return repositorioProducto.actualizarPorId(id, datosActualizar);
  },

  async eliminarProducto(id, usuario) {
    const producto = await repositorioProducto.buscarPorId(id);
    if (!producto) throw ErrorAplicacion.noEncontrado('El producto no existe.');

    const esVendedor = String(producto.vendedor._id) === String(usuario._id);
    if (!esVendedor && !esRolAdministracion(usuario.rol)) {
      throw ErrorAplicacion.prohibido('Solo el vendedor puede eliminar este producto.');
    }

    await repositorioProducto.eliminarPorId(id);
    return { mensaje: 'Producto eliminado correctamente.' };
  },

  /** Registra el interes de un comprador y avisa al vendedor. */
  async contactarVendedor(id, usuario, mensaje = '') {
    const producto = await repositorioProducto.buscarPorId(id);
    if (!producto || !producto.activo) throw ErrorAplicacion.noEncontrado('El producto no existe.');

    const vendedorId = producto.vendedor._id;
    if (String(vendedorId) === String(usuario._id)) {
      throw ErrorAplicacion.solicitudInvalida('No puedes contactarte a ti mismo por tu propio producto.');
    }

    const bloqueo = await repositorioBloqueo.existeBloqueoEntre(usuario._id, vendedorId);
    if (bloqueo) throw ErrorAplicacion.prohibido('No es posible contactar al vendedor.');

    // Se registra el interesado sin duplicados.
    const interesados = producto.interesados.map(String);
    if (!interesados.includes(String(usuario._id))) {
      await repositorioProducto.actualizarPorId(id, { interesados: [...producto.interesados, usuario._id] });
    }

    await servicioNotificacion.crear({
      usuario: vendedorId,
      actor: usuario._id,
      tipo: 'mensaje',
      titulo: 'Interes en tu producto',
      mensaje: `${usuario.nombres} esta interesado en "${producto.titulo}".`,
      enlace: `/marketplace/${id}`,
      referencias: { producto: id },
    });

    return {
      vendedor: {
        _id: producto.vendedor._id,
        nombres: producto.vendedor.nombres,
        apellidos: producto.vendedor.apellidos,
        fotoPerfil: producto.vendedor.fotoPerfil,
      },
      mensaje,
    };
  },
};

module.exports = { servicioProducto };
