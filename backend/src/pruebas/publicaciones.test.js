const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const {
  prepararEntornoPruebas,
  crearUsuarioVerificado,
  iniciarSesionPrueba,
  DOMINIO,
} = require('./utilidadesPruebas');
const { repositorioAmistad } = require('../repositorios/repositorioAmistad');

let cliente;
let cerrar;
let tokenAutor;
let tokenAmigo;
let usuarioAutor;
let usuarioAmigo;
let publicacionId;

describe('Publicaciones, comentarios y reacciones', () => {
  before(async () => {
    const entorno = await prepararEntornoPruebas();
    cliente = entorno.cliente;
    cerrar = entorno.cerrar;

    usuarioAutor = await crearUsuarioVerificado({
      nombres: 'Autor',
      apellidos: 'Principal',
      correo: `autor${DOMINIO}`,
    });
    usuarioAmigo = await crearUsuarioVerificado({
      nombres: 'Amigo',
      apellidos: 'Secundario',
      correo: `amigo${DOMINIO}`,
    });

    tokenAutor = await iniciarSesionPrueba(cliente, usuarioAutor.correo);
    tokenAmigo = await iniciarSesionPrueba(cliente, usuarioAmigo.correo);
  });

  after(async () => {
    await cerrar();
  });

  test('crea una publicacion con texto y categoria', async () => {
    const respuesta = await cliente
      .post('/api/publicaciones')
      .set('Authorization', `Bearer ${tokenAutor}`)
      .send({ contenido: 'Primera publicacion de prueba en EMI Connect.', categoria: 'general' });

    assert.strictEqual(respuesta.status, 201);
    assert.strictEqual(respuesta.body.exito, true);
    assert.strictEqual(respuesta.body.datos.publicacion.categoria, 'general');
    assert.strictEqual(respuesta.body.datos.publicacion.cantidadComentarios, 0);

    publicacionId = respuesta.body.datos.publicacion._id;
  });

  test('rechaza una publicacion vacia', async () => {
    const respuesta = await cliente
      .post('/api/publicaciones')
      .set('Authorization', `Bearer ${tokenAutor}`)
      .send({ contenido: '' });

    assert.strictEqual(respuesta.status, 400);
  });

  test('no permite publicar contenido institucional a un estudiante', async () => {
    const respuesta = await cliente
      .post('/api/publicaciones')
      .set('Authorization', `Bearer ${tokenAutor}`)
      .send({ contenido: 'Aviso institucional no autorizado', categoria: 'institucional' });

    assert.strictEqual(respuesta.status, 403);
    assert.match(respuesta.body.mensaje, /institucional/i);
  });

  test('lista las publicaciones del perfil', async () => {
    const respuesta = await cliente
      .get(`/api/publicaciones/usuario/${usuarioAutor._id}`)
      .set('Authorization', `Bearer ${tokenAutor}`);

    assert.strictEqual(respuesta.status, 200);
    assert.strictEqual(respuesta.body.datos.publicaciones.length, 1);
  });

  test('el feed del amigo incluye la publicacion tras la amistad', async () => {
    let feed = await cliente.get('/api/publicaciones').set('Authorization', `Bearer ${tokenAmigo}`);
    assert.strictEqual(feed.body.datos.publicaciones.length, 0);

    // Se crea la amistad aceptada y el autor aparece en el feed.
    await repositorioAmistad.crear({
      solicitante: usuarioAmigo._id,
      receptor: usuarioAutor._id,
      estado: 'aceptada',
      fechaRespuesta: new Date(),
    });

    feed = await cliente.get('/api/publicaciones').set('Authorization', `Bearer ${tokenAmigo}`);
    assert.strictEqual(feed.body.datos.publicaciones.length, 1);
    assert.strictEqual(feed.body.datos.publicaciones[0].miReaccion, null);
    assert.strictEqual(feed.body.datos.publicaciones[0].guardada, false);
  });

  test('registra y cambia la reaccion de un usuario', async () => {
    const reaccion = await cliente
      .post('/api/reacciones')
      .set('Authorization', `Bearer ${tokenAmigo}`)
      .send({ objetivoId: publicacionId, objetivoModelo: 'Publicacion', tipo: 'me_gusta' });

    assert.strictEqual(reaccion.status, 200);
    assert.strictEqual(reaccion.body.datos.resumen.me_gusta, 1);

    const cambio = await cliente
      .post('/api/reacciones')
      .set('Authorization', `Bearer ${tokenAmigo}`)
      .send({ objetivoId: publicacionId, objetivoModelo: 'Publicacion', tipo: 'me_encanta' });

    assert.strictEqual(cambio.body.datos.resumen.me_encanta, 1);
    assert.strictEqual(cambio.body.datos.resumen.me_gusta, 0);
  });

  test('retira la reaccion al repetir el mismo tipo', async () => {
    const respuesta = await cliente
      .post('/api/reacciones')
      .set('Authorization', `Bearer ${tokenAmigo}`)
      .send({ objetivoId: publicacionId, objetivoModelo: 'Publicacion', tipo: 'me_encanta' });

    assert.strictEqual(respuesta.body.datos.reaccion, null);

    const publicacion = await cliente
      .get(`/api/publicaciones/${publicacionId}`)
      .set('Authorization', `Bearer ${tokenAmigo}`);
    assert.strictEqual(publicacion.body.datos.publicacion.reaccionesResumen.me_encanta, 0);
  });

  test('rechaza un tipo de reaccion no valido', async () => {
    const respuesta = await cliente
      .post('/api/reacciones')
      .set('Authorization', `Bearer ${tokenAutor}`)
      .send({ objetivoId: publicacionId, objetivoModelo: 'Publicacion', tipo: 'reaccion_inventada' });

    assert.strictEqual(respuesta.status, 400);
  });

  test('crea un comentario y una respuesta anidada', async () => {
    const comentario = await cliente
      .post(`/api/publicaciones/${publicacionId}/comentarios`)
      .set('Authorization', `Bearer ${tokenAmigo}`)
      .send({ contenido: 'Comentario de prueba del amigo.' });

    assert.strictEqual(comentario.status, 201);
    const comentarioId = comentario.body.datos.comentario._id;

    const respuesta = await cliente
      .post(`/api/publicaciones/${publicacionId}/comentarios`)
      .set('Authorization', `Bearer ${tokenAutor}`)
      .send({ contenido: 'Respuesta del autor.', comentarioPadreId: comentarioId });

    assert.strictEqual(respuesta.status, 201);
    assert.strictEqual(respuesta.body.datos.comentario.nivel, 2);

    const listado = await cliente
      .get(`/api/publicaciones/${publicacionId}/comentarios`)
      .set('Authorization', `Bearer ${tokenAutor}`);

    assert.strictEqual(listado.body.datos.comentarios.length, 1);
    assert.strictEqual(listado.body.datos.comentarios[0].respuestas.length, 1);

    const publicacion = await cliente
      .get(`/api/publicaciones/${publicacionId}`)
      .set('Authorization', `Bearer ${tokenAutor}`);
    assert.strictEqual(publicacion.body.datos.publicacion.cantidadComentarios, 2);
  });

  test('solo el autor puede editar su comentario', async () => {
    const listado = await cliente
      .get(`/api/publicaciones/${publicacionId}/comentarios`)
      .set('Authorization', `Bearer ${tokenAutor}`);
    const comentarioDeAmigo = listado.body.datos.comentarios[0];

    const intentoAjeno = await cliente
      .put(`/api/comentarios/${comentarioDeAmigo._id}`)
      .set('Authorization', `Bearer ${tokenAutor}`)
      .send({ contenido: 'Intento de edicion ajena' });

    assert.strictEqual(intentoAjeno.status, 403);

    const propio = await cliente
      .put(`/api/comentarios/${comentarioDeAmigo._id}`)
      .set('Authorization', `Bearer ${tokenAmigo}`)
      .send({ contenido: 'Comentario editado por su autor' });

    assert.strictEqual(propio.status, 200);
    assert.strictEqual(propio.body.datos.comentario.editado, true);
  });

  test('guarda y quita una publicacion de guardados', async () => {
    const guardar = await cliente
      .post(`/api/publicaciones/${publicacionId}/guardar`)
      .set('Authorization', `Bearer ${tokenAmigo}`);
    assert.strictEqual(guardar.body.datos.guardada, true);

    const guardadas = await cliente
      .get('/api/publicaciones/guardadas')
      .set('Authorization', `Bearer ${tokenAmigo}`);
    assert.strictEqual(guardadas.body.datos.publicaciones.length, 1);

    const quitar = await cliente
      .post(`/api/publicaciones/${publicacionId}/guardar`)
      .set('Authorization', `Bearer ${tokenAmigo}`);
    assert.strictEqual(quitar.body.datos.guardada, false);
  });

  test('comparte una publicacion conservando la referencia original', async () => {
    const respuesta = await cliente
      .post(`/api/publicaciones/${publicacionId}/compartir`)
      .set('Authorization', `Bearer ${tokenAmigo}`)
      .send({ comentario: 'Comparto esta publicacion.' });

    assert.strictEqual(respuesta.status, 201);
    assert.ok(respuesta.body.datos.publicacion.publicacionOriginal);

    const original = await cliente
      .get(`/api/publicaciones/${publicacionId}`)
      .set('Authorization', `Bearer ${tokenAutor}`);
    assert.strictEqual(original.body.datos.publicacion.cantidadCompartidos, 1);
  });

  test('solo el autor puede eliminar su publicacion', async () => {
    const intentoAjeno = await cliente
      .delete(`/api/publicaciones/${publicacionId}`)
      .set('Authorization', `Bearer ${tokenAmigo}`);
    assert.strictEqual(intentoAjeno.status, 403);

    const propio = await cliente
      .delete(`/api/publicaciones/${publicacionId}`)
      .set('Authorization', `Bearer ${tokenAutor}`);
    assert.strictEqual(propio.status, 200);

    const consulta = await cliente
      .get(`/api/publicaciones/${publicacionId}`)
      .set('Authorization', `Bearer ${tokenAutor}`);
    assert.strictEqual(consulta.status, 404);
  });
});
