const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const {
  prepararEntornoPruebas,
  crearUsuarioVerificado,
  iniciarSesionPrueba,
  DOMINIO,
} = require('./utilidadesPruebas');
const { ROLES } = require('../constantes/roles');

let cliente;
let cerrar;
let tokenEstudiante;
let tokenDocente;
let tokenAdmin;
let estudiante;
let docente;
let admin;

describe('Permisos, comunidades, privacidad y busqueda', () => {
  before(async () => {
    const entorno = await prepararEntornoPruebas();
    cliente = entorno.cliente;
    cerrar = entorno.cerrar;

    estudiante = await crearUsuarioVerificado({
      nombres: 'Estudiante',
      apellidos: 'Comun',
      correo: `estudiante${DOMINIO}`,
      rol: ROLES.ESTUDIANTE,
      intereses: ['Robotica'],
    });
    docente = await crearUsuarioVerificado({
      nombres: 'Docente',
      apellidos: 'Academico',
      correo: `docente${DOMINIO}`,
      rol: ROLES.DOCENTE,
      carrera: 'Ingenieria de Sistemas',
      semestre: null,
    });
    admin = await crearUsuarioVerificado({
      nombres: 'Administrador',
      apellidos: 'Plataforma',
      correo: `admin${DOMINIO}`,
      rol: ROLES.ADMINISTRADOR,
      semestre: null,
    });

    tokenEstudiante = await iniciarSesionPrueba(cliente, estudiante.correo);
    tokenDocente = await iniciarSesionPrueba(cliente, docente.correo);
    tokenAdmin = await iniciarSesionPrueba(cliente, admin.correo);
  });

  after(async () => {
    await cerrar();
  });

  test('un docente si puede publicar contenido institucional', async () => {
    const respuesta = await cliente
      .post('/api/publicaciones')
      .set('Authorization', `Bearer ${tokenDocente}`)
      .send({ contenido: 'Aviso oficial de la coordinacion academica.', categoria: 'institucional' });

    assert.strictEqual(respuesta.status, 201);
    assert.strictEqual(respuesta.body.datos.publicacion.esInstitucional, true);
  });

  test('un estudiante no puede acceder al panel administrativo', async () => {
    const respuesta = await cliente.get('/api/admin/resumen').set('Authorization', `Bearer ${tokenEstudiante}`);
    assert.strictEqual(respuesta.status, 403);
  });

  test('un administrador si puede acceder al resumen y a las estadisticas', async () => {
    const resumen = await cliente.get('/api/admin/resumen').set('Authorization', `Bearer ${tokenAdmin}`);
    assert.strictEqual(resumen.status, 200);
    assert.ok(resumen.body.datos.resumen.usuarios.total >= 3);

    const estadisticas = await cliente
      .get('/api/admin/estadisticas')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    assert.strictEqual(estadisticas.status, 200);
    assert.ok(Array.isArray(estadisticas.body.datos.crecimiento.usuariosPorDia));
  });

  test('un usuario no puede cambiarse el rol a si mismo desde el panel', async () => {
    const respuesta = await cliente
      .patch(`/api/admin/usuarios/${admin._id}/rol`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ rol: ROLES.ESTUDIANTE });

    assert.strictEqual(respuesta.status, 400);
  });

  test('el creador de una comunidad puede administrarla y otros pueden unirse y salir', async () => {
    const creacion = await cliente
      .post('/api/comunidades')
      .set('Authorization', `Bearer ${tokenEstudiante}`)
      .send({ nombre: 'Robotica EMI Prueba', descripcion: 'Comunidad de prueba' });

    assert.strictEqual(creacion.status, 201);
    const comunidadId = creacion.body.datos.comunidad._id;

    const unirse = await cliente
      .post(`/api/comunidades/${comunidadId}/unirse`)
      .set('Authorization', `Bearer ${tokenDocente}`);
    assert.strictEqual(unirse.status, 200);
    assert.strictEqual(unirse.body.datos.estado, 'activo');

    const detalle = await cliente
      .get(`/api/comunidades/${comunidadId}`)
      .set('Authorization', `Bearer ${tokenDocente}`);
    assert.strictEqual(detalle.body.datos.comunidad.soyMiembro, true);
    assert.strictEqual(detalle.body.datos.comunidad.cantidadMiembros, 2);

    // Estando dentro, el docente puede publicar dentro de la comunidad.
    const miembro = await cliente
      .post('/api/publicaciones')
      .set('Authorization', `Bearer ${tokenDocente}`)
      .send({ contenido: 'Publicacion dentro de la comunidad de prueba.', comunidad: comunidadId });
    assert.strictEqual(miembro.status, 201);

    const listado = await cliente
      .get(`/api/comunidades/${comunidadId}/publicaciones`)
      .set('Authorization', `Bearer ${tokenDocente}`);
    assert.strictEqual(listado.body.datos.publicaciones.length, 1);

    const salir = await cliente
      .delete(`/api/comunidades/${comunidadId}/salir`)
      .set('Authorization', `Bearer ${tokenDocente}`);
    assert.strictEqual(salir.status, 200);

    // Al salir de la comunidad ya no puede publicar en ella.
    const fuera = await cliente
      .post('/api/publicaciones')
      .set('Authorization', `Bearer ${tokenDocente}`)
      .send({ contenido: 'Publicacion sin ser miembro.', comunidad: comunidadId });
    assert.strictEqual(fuera.status, 403);
  });

  test('no se puede publicar en una comunidad ajena', async () => {
    const creacion = await cliente
      .post('/api/comunidades')
      .set('Authorization', `Bearer ${tokenDocente}`)
      .send({ nombre: 'Comunidad del docente', descripcion: 'Solo docentes' });

    const comunidadId = creacion.body.datos.comunidad._id;

    const intento = await cliente
      .post('/api/publicaciones')
      .set('Authorization', `Bearer ${tokenEstudiante}`)
      .send({ contenido: 'Intento de publicacion ajena.', comunidad: comunidadId });

    assert.strictEqual(intento.status, 403);
  });

  test('al bloquear a un usuario no se puede enviar solicitudes ni mensajes', async () => {
    const bloqueo = await cliente
      .post(`/api/usuarios/bloqueos/${docente._id}`)
      .set('Authorization', `Bearer ${tokenEstudiante}`)
      .send({ motivo: 'Prueba de bloqueo' });
    assert.strictEqual(bloqueo.status, 200);

    const solicitud = await cliente
      .post('/api/amistades/solicitudes')
      .set('Authorization', `Bearer ${tokenEstudiante}`)
      .send({ usuarioId: docente._id });
    assert.strictEqual(solicitud.status, 403);

    const mensaje = await cliente
      .post('/api/mensajes')
      .set('Authorization', `Bearer ${tokenEstudiante}`)
      .send({ destinatarioId: docente._id, contenido: 'Mensaje a un usuario bloqueado' });
    assert.strictEqual(mensaje.status, 403);

    const listaBloqueados = await cliente
      .get('/api/usuarios/bloqueos')
      .set('Authorization', `Bearer ${tokenEstudiante}`);
    assert.strictEqual(listaBloqueados.body.datos.bloqueados.length, 1);

    const desbloqueo = await cliente
      .delete(`/api/usuarios/bloqueos/${docente._id}`)
      .set('Authorization', `Bearer ${tokenEstudiante}`);
    assert.strictEqual(desbloqueo.status, 200);
  });

  test('permite enviar solicitud de amistad, aceptarla y listar amigos', async () => {
    const solicitud = await cliente
      .post('/api/amistades/solicitudes')
      .set('Authorization', `Bearer ${tokenEstudiante}`)
      .send({ usuarioId: docente._id, mensaje: 'Somos companeros de la carrera.' });

    assert.strictEqual(solicitud.status, 201);
    const amistadId = solicitud.body.datos.amistad._id;

    const recibidas = await cliente
      .get('/api/amistades/solicitudes/recibidas')
      .set('Authorization', `Bearer ${tokenDocente}`);
    assert.strictEqual(recibidas.body.datos.solicitudes.length, 1);

    const aceptar = await cliente
      .patch(`/api/amistades/solicitudes/${amistadId}/aceptar`)
      .set('Authorization', `Bearer ${tokenDocente}`);
    assert.strictEqual(aceptar.status, 200);

    const amigos = await cliente.get('/api/amistades').set('Authorization', `Bearer ${tokenEstudiante}`);
    assert.strictEqual(amigos.body.datos.amigos.length, 1);
    assert.strictEqual(amigos.body.datos.amigos[0].correo, docente.correo);
  });

  test('la privacidad "solo amigos" restringe las publicaciones del perfil', async () => {
    await cliente
      .put('/api/usuarios/privacidad')
      .set('Authorization', `Bearer ${tokenDocente}`)
      .send({ visibilidadPublicaciones: 'solo_amigos' });

    const otro = await crearUsuarioVerificado({
      nombres: 'Ajeno',
      apellidos: 'Desconocido',
      correo: `ajeno${DOMINIO}`,
    });
    const tokenAjeno = await iniciarSesionPrueba(cliente, otro.correo);

    const respuesta = await cliente
      .get(`/api/publicaciones/usuario/${docente._id}`)
      .set('Authorization', `Bearer ${tokenAjeno}`);

    assert.strictEqual(respuesta.status, 403);
    assert.match(respuesta.body.mensaje, /solo con sus contactos/i);

    // El amigo si puede ver las publicaciones.
    const comoAmigo = await cliente
      .get(`/api/publicaciones/usuario/${docente._id}`)
      .set('Authorization', `Bearer ${tokenEstudiante}`);
    assert.strictEqual(comoAmigo.status, 200);
  });

  test('la busqueda global encuentra usuarios, comunidades y publicaciones', async () => {
    const respuesta = await cliente
      .get('/api/busqueda?buscar=robotica')
      .set('Authorization', `Bearer ${tokenEstudiante}`);

    assert.strictEqual(respuesta.status, 200);
    assert.ok(respuesta.body.datos.comunidades.length >= 1);
    assert.ok(respuesta.body.datos.totales.usuarios >= 1);
  });

  test('la busqueda exige al menos dos caracteres', async () => {
    const respuesta = await cliente.get('/api/busqueda?buscar=a').set('Authorization', `Bearer ${tokenEstudiante}`);
    assert.strictEqual(respuesta.status, 400);
  });

  test('el asistente responde consultas sobre comunidades', async () => {
    const respuesta = await cliente
      .post('/api/asistente/consultar')
      .set('Authorization', `Bearer ${tokenEstudiante}`)
      .send({ consulta: 'comunidades de robotica' });

    assert.strictEqual(respuesta.status, 200);
    assert.strictEqual(respuesta.body.datos.intencion, 'buscar_comunidades');
    assert.strictEqual(respuesta.body.datos.motor, 'reglas_locales');
  });

  test('un usuario no puede reportar su propio contenido', async () => {
    const publicacion = await cliente
      .post('/api/publicaciones')
      .set('Authorization', `Bearer ${tokenEstudiante}`)
      .send({ contenido: 'Publicacion para probar reportes.' });

    const respuesta = await cliente
      .post('/api/reportes')
      .set('Authorization', `Bearer ${tokenEstudiante}`)
      .send({
        tipo: 'publicacion',
        objetivoId: publicacion.body.datos.publicacion._id,
        motivo: 'spam',
      });

    assert.strictEqual(respuesta.status, 400);
    assert.match(respuesta.body.mensaje, /tu propio contenido/i);
  });

  test('un tercero puede reportar el contenido y la administracion resolverlo', async () => {
    const publicacion = await cliente
      .post('/api/publicaciones')
      .set('Authorization', `Bearer ${tokenEstudiante}`)
      .send({ contenido: 'Publicacion reportable por un tercero.' });

    const publicacionId = publicacion.body.datos.publicacion._id;

    const reporte = await cliente
      .post('/api/reportes')
      .set('Authorization', `Bearer ${tokenDocente}`)
      .send({ tipo: 'publicacion', objetivoId: publicacionId, motivo: 'contenido_ofensivo' });

    assert.strictEqual(reporte.status, 201);

    const duplicado = await cliente
      .post('/api/reportes')
      .set('Authorization', `Bearer ${tokenDocente}`)
      .send({ tipo: 'publicacion', objetivoId: publicacionId, motivo: 'spam' });
    assert.strictEqual(duplicado.status, 409);

    const listado = await cliente.get('/api/admin/reportes').set('Authorization', `Bearer ${tokenAdmin}`);
    assert.strictEqual(listado.status, 200);
    assert.strictEqual(listado.body.datos.reportes.length, 1);

    const resolucion = await cliente
      .patch(`/api/reportes/${reporte.body.datos.reporte._id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'resuelto', accion: 'eliminar_contenido', notaRevision: 'Contenido eliminado.' });

    assert.strictEqual(resolucion.status, 200);

    const verificacion = await cliente
      .get(`/api/publicaciones/${publicacionId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    assert.strictEqual(verificacion.status, 404);
  });
});
