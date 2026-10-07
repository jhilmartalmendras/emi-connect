const { servicioProducto } = require('../servicios/servicioProducto');
const { asincrono } = require('../utilidades/asincrono');
const { respuestaExito } = require('../utilidades/respuesta');

const controladorProducto = {
  /** GET /api/productos */
  listar: asincrono(async (req, res) => {
    const resultado = await servicioProducto.listarProductos(req.query, req.usuario?._id || null);
    return respuestaExito(res, resultado, 'Productos obtenidos correctamente.');
  }),

  /** GET /api/productos/mios */
  listarMios: asincrono(async (req, res) => {
    const resultado = await servicioProducto.listarMisProductos(req.usuario._id, req.query);
    return respuestaExito(res, resultado, 'Tus productos fueron obtenidos correctamente.');
  }),

  /** GET /api/productos/:id */
  obtener: asincrono(async (req, res) => {
    const resultado = await servicioProducto.obtenerProducto(req.params.id, req.usuario?._id || null);
    return respuestaExito(res, resultado, 'Producto obtenido correctamente.');
  }),

  /** POST /api/productos */
  crear: asincrono(async (req, res) => {
    const imagenes = req.files && req.files.length > 0
      ? req.files.map((archivo) => `/uploads/productos/${archivo.filename}`)
      : req.body.imagenes || [];

    const producto = await servicioProducto.crearProducto(req.usuario, {
      titulo: req.body.titulo,
      descripcion: req.body.descripcion,
      precio: req.body.precio,
      moneda: req.body.moneda,
      esNegociable: req.body.esNegociable,
      categoria: req.body.categoria,
      ubicacion: req.body.ubicacion,
      imagenes,
    });

    return respuestaExito(res, { producto }, 'Producto publicado correctamente.', 201);
  }),

  /** PUT /api/productos/:id */
  actualizar: asincrono(async (req, res) => {
    const producto = await servicioProducto.actualizarProducto(req.params.id, req.usuario, req.body);
    return respuestaExito(res, { producto }, 'Producto actualizado correctamente.');
  }),

  /** DELETE /api/productos/:id */
  eliminar: asincrono(async (req, res) => {
    const resultado = await servicioProducto.eliminarProducto(req.params.id, req.usuario);
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** POST /api/productos/:id/contactar */
  contactar: asincrono(async (req, res) => {
    const resultado = await servicioProducto.contactarVendedor(
      req.params.id,
      req.usuario,
      req.body.mensaje || ''
    );
    return respuestaExito(res, resultado, 'Se registro tu interes. Puedes escribirle al vendedor por mensajeria.');
  }),
};

module.exports = { controladorProducto };
