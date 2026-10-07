const mongoose = require('mongoose');
const request = require('supertest');
const { crearAplicacion } = require('../aplicaciones/aplicacion');
const { conectarBaseDatos, desconectarBaseDatos } = require('../config/baseDatos');
const { servicioCorreo } = require('../servicios/servicioCorreo');
const Usuario = require('../modelos/Usuario');
const { repositorioUsuario } = require('../repositorios/repositorioUsuario');
const { repositorioPrivacidad } = require('../repositorios/repositorioPrivacidad');
const { ROLES } = require('../constantes/roles');

// Base de datos exclusiva para pruebas: nunca se usa la base de datos real.
const URI_PRUEBAS = process.env.MONGODB_URI_PRUEBAS || 'mongodb://127.0.0.1:27017/emi_connect_pruebas';
const DOMINIO = '@est.emi.edu.bo';

/**
 * Arranca la aplicacion en memoria para las pruebas.
 * Devuelve un cliente supertest y una funcion para cerrar todo.
 */
async function prepararEntornoPruebas() {
  await conectarBaseDatos(URI_PRUEBAS);

  // Se limpia la base de datos de pruebas antes de cada suite.
  const colecciones = await mongoose.connection.db.collections();
  await Promise.all(colecciones.map((coleccion) => coleccion.deleteMany({})));

  const aplicacion = crearAplicacion();
  const cliente = request(aplicacion);

  return {
    cliente,
    cerrar: async () => {
      await desconectarBaseDatos();
    },
  };
}

/**
 * Intercepta el envio de correos para capturar el codigo de verificacion
 * sin depender de un servidor SMTP.
 */
function interceptarCorreos() {
  const capturados = { codigos: {}, mensajes: [] };

  const originalVerificacion = servicioCorreo.enviarCodigoVerificacion;
  const originalRecuperacion = servicioCorreo.enviarCodigoRecuperacion;
  const originalNotificacion = servicioCorreo.enviarNotificacionImportante;

  servicioCorreo.enviarCodigoVerificacion = async ({ destino, codigo }) => {
    capturados.codigos[destino] = codigo;
    capturados.mensajes.push({ tipo: 'verificacion', destino, codigo });
    return { enviado: true, simulado: true };
  };

  servicioCorreo.enviarCodigoRecuperacion = async ({ destino, codigo }) => {
    capturados.codigos[destino] = codigo;
    capturados.mensajes.push({ tipo: 'recuperacion', destino, codigo });
    return { enviado: true, simulado: true };
  };

  servicioCorreo.enviarNotificacionImportante = async (datos) => {
    capturados.mensajes.push({ tipo: 'notificacion', ...datos });
    return { enviado: true, simulado: true };
  };

  return {
    capturados,
    restaurar() {
      servicioCorreo.enviarCodigoVerificacion = originalVerificacion;
      servicioCorreo.enviarCodigoRecuperacion = originalRecuperacion;
      servicioCorreo.enviarNotificacionImportante = originalNotificacion;
    },
  };
}

/** Crea un usuario verificado directamente en la base de datos de pruebas. */
async function crearUsuarioVerificado({
  nombres = 'Usuario',
  apellidos = 'Prueba',
  correo = `usuario${Date.now()}${DOMINIO}`,
  contrasena = 'Prueba2026',
  rol = ROLES.ESTUDIANTE,
  carrera = 'Ingenieria de Sistemas',
  semestre = 5,
  intereses = [],
} = {}) {
  const contrasenaCifrada = await Usuario.cifrarContrasena(contrasena);
  const usuario = await repositorioUsuario.crear({
    nombres,
    apellidos,
    correo,
    contrasena: contrasenaCifrada,
    rol,
    carrera,
    semestre,
    intereses,
    verificado: true,
    activo: true,
  });

  await repositorioPrivacidad.obtenerOCrear(usuario._id);
  return usuario;
}

/** Inicia sesion y devuelve el token de un usuario de prueba. */
async function iniciarSesionPrueba(cliente, correo, contrasena = 'Prueba2026') {
  const respuesta = await cliente.post('/api/auth/login').send({ correo, contrasena });
  return respuesta.body.datos.token;
}

module.exports = {
  URI_PRUEBAS,
  DOMINIO,
  prepararEntornoPruebas,
  interceptarCorreos,
  crearUsuarioVerificado,
  iniciarSesionPrueba,
};
