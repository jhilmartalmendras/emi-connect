const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const {
  prepararEntornoPruebas,
  interceptarCorreos,
  DOMINIO,
} = require('./utilidadesPruebas');

let cliente;
let cerrar;
let interceptacion;

const correoPrueba = `nuevo.estudiante${DOMINIO}`;
const contrasena = 'Segura2026';

describe('Autenticacion institucional', () => {
  before(async () => {
    const entorno = await prepararEntornoPruebas();
    cliente = entorno.cliente;
    cerrar = entorno.cerrar;
    interceptacion = interceptarCorreos();
  });

  after(async () => {
    interceptacion.restaurar();
    await cerrar();
  });

  test('rechaza el registro con un correo que no es institucional', async () => {
    const respuesta = await cliente.post('/api/auth/registro').send({
      nombres: 'Juan',
      apellidos: 'Perez',
      correo: 'juan.perez@gmail.com',
      contrasena: 'Segura2026',
      confirmarContrasena: 'Segura2026',
    });

    assert.strictEqual(respuesta.status, 400);
    assert.strictEqual(respuesta.body.exito, false);
    assert.match(respuesta.body.mensaje, /institucional/i);
  });

  test('rechaza el registro cuando las contrasenas no coinciden', async () => {
    const respuesta = await cliente.post('/api/auth/registro').send({
      nombres: 'Ana',
      apellidos: 'Lopez',
      correo: `ana.lopez${DOMINIO}`,
      contrasena: 'Segura2026',
      confirmarContrasena: 'OtraClave2026',
    });

    assert.strictEqual(respuesta.status, 400);
    assert.match(respuesta.body.errores[0].mensaje, /no coinciden/i);
  });

  test('registra una cuenta institucional y envia el codigo de verificacion', async () => {
    const respuesta = await cliente.post('/api/auth/registro').send({
      nombres: 'Nuevo',
      apellidos: 'Estudiante',
      correo: correoPrueba,
      contrasena,
      confirmarContrasena: contrasena,
      carrera: 'Ingenieria de Sistemas',
      semestre: 3,
    });

    assert.strictEqual(respuesta.status, 201);
    assert.strictEqual(respuesta.body.exito, true);
    assert.strictEqual(respuesta.body.datos.usuario.verificado, false);
    assert.ok(interceptacion.capturados.codigos[correoPrueba], 'debe haberse enviado un codigo');
    assert.match(interceptacion.capturados.codigos[correoPrueba], /^\d{6}$/);
  });

  test('impide registrar dos veces el mismo correo institucional', async () => {
    const respuesta = await cliente.post('/api/auth/registro').send({
      nombres: 'Nuevo',
      apellidos: 'Estudiante',
      correo: correoPrueba,
      contrasena,
      confirmarContrasena: contrasena,
    });

    assert.strictEqual(respuesta.status, 409);
    assert.match(respuesta.body.mensaje, /ya se encuentra registrado/i);
  });

  test('no permite iniciar sesion sin verificar la cuenta', async () => {
    const respuesta = await cliente.post('/api/auth/login').send({ correo: correoPrueba, contrasena });

    assert.strictEqual(respuesta.status, 403);
    assert.match(respuesta.body.mensaje, /no fue verificada/i);
  });

  test('rechaza un codigo de verificacion incorrecto', async () => {
    const respuesta = await cliente.post('/api/auth/verificar').send({
      correo: correoPrueba,
      codigo: '000000',
    });

    assert.strictEqual(respuesta.status, 400);
    assert.match(respuesta.body.mensaje, /no es correcto|expiro/i);
  });

  test('verifica la cuenta con el codigo de 6 digitos y permite iniciar sesion', async () => {
    const codigo = interceptacion.capturados.codigos[correoPrueba];

    const verificacion = await cliente.post('/api/auth/verificar').send({ correo: correoPrueba, codigo });
    assert.strictEqual(verificacion.status, 200);
    assert.strictEqual(verificacion.body.datos.verificado, true);

    const ingreso = await cliente.post('/api/auth/login').send({ correo: correoPrueba, contrasena });
    assert.strictEqual(ingreso.status, 200);
    assert.ok(ingreso.body.datos.token, 'debe devolver un token JWT');
    assert.strictEqual(ingreso.body.datos.usuario.correo, correoPrueba);
    assert.ok(!('contrasena' in ingreso.body.datos.usuario), 'no debe exponer la contrasena');
  });

  test('no permite reutilizar un codigo ya usado', async () => {
    const codigo = interceptacion.capturados.codigos[correoPrueba];
    const respuesta = await cliente.post('/api/auth/verificar').send({ correo: correoPrueba, codigo });

    // La cuenta ya esta verificada: la respuesta es exitosa pero no revalida el codigo.
    assert.strictEqual(respuesta.status, 200);
    assert.strictEqual(respuesta.body.datos.verificado, true);
  });

  test('rechaza credenciales incorrectas', async () => {
    const respuesta = await cliente.post('/api/auth/login').send({
      correo: correoPrueba,
      contrasena: 'ContrasenaIncorrecta1',
    });

    assert.strictEqual(respuesta.status, 401);
    assert.match(respuesta.body.mensaje, /no son correctas/i);
  });

  test('protege las rutas privadas sin token', async () => {
    const respuesta = await cliente.get('/api/auth/sesion');
    assert.strictEqual(respuesta.status, 401);
  });

  test('devuelve la sesion con un token valido', async () => {
    const ingreso = await cliente.post('/api/auth/login').send({ correo: correoPrueba, contrasena });
    const token = ingreso.body.datos.token;

    const sesion = await cliente.get('/api/auth/sesion').set('Authorization', `Bearer ${token}`);
    assert.strictEqual(sesion.status, 200);
    assert.strictEqual(sesion.body.datos.usuario.correo, correoPrueba);
  });

  test('rechaza un token invalido', async () => {
    const respuesta = await cliente
      .get('/api/auth/sesion')
      .set('Authorization', 'Bearer token.invalido.falso');

    assert.strictEqual(respuesta.status, 401);
  });

  test('recupera la contrasena en tres pasos', async () => {
    const solicitud = await cliente.post('/api/auth/recuperar').send({ correo: correoPrueba });
    assert.strictEqual(solicitud.status, 200);
    assert.match(solicitud.body.mensaje, /Si el correo pertenece/i);

    const codigo = interceptacion.capturados.codigos[correoPrueba];
    const verificacion = await cliente
      .post('/api/auth/verificar-recuperacion')
      .send({ correo: correoPrueba, codigo });
    assert.strictEqual(verificacion.status, 200);
    assert.ok(verificacion.body.datos.tokenTemporal);

    const nuevaContrasena = 'NuevaClave2026';
    const restablecimiento = await cliente.post('/api/auth/restablecer').send({
      tokenTemporal: verificacion.body.datos.tokenTemporal,
      nuevaContrasena,
      confirmarContrasena: nuevaContrasena,
    });
    assert.strictEqual(restablecimiento.status, 200);

    const ingreso = await cliente.post('/api/auth/login').send({ correo: correoPrueba, contrasena: nuevaContrasena });
    assert.strictEqual(ingreso.status, 200);
    assert.ok(ingreso.body.datos.token);
  });

  test('no revela si un correo existe en la solicitud de recuperacion', async () => {
    const respuesta = await cliente.post('/api/auth/recuperar').send({
      correo: `noexiste${DOMINIO}`,
    });

    assert.strictEqual(respuesta.status, 200);
    assert.strictEqual(respuesta.body.datos.enviado, false);
  });
});
