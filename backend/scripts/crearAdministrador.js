/**
 * Script para crear el administrador inicial de EMI Connect.
 *
 * Uso:
 *   npm run crear-admin
 *
 * Solicita los datos por consola (nombres, apellidos, correo institucional y
 * contrasena). Tambien acepta los valores por variables de entorno
 * (ADMIN_NOMBRES, ADMIN_APELLIDOS, ADMIN_CORREO, ADMIN_CONTRASENA) para
 * automatizar la instalacion sin interaccion.
 *
 * No se guarda ninguna credencial en el codigo ni en el repositorio.
 */
const readline = require('readline');
const { conectarBaseDatos, desconectarBaseDatos } = require('../src/config/baseDatos');
const { variablesEntorno } = require('../src/config/variablesEntorno');
const { repositorioUsuario } = require('../src/repositorios/repositorioUsuario');
const { repositorioPrivacidad } = require('../src/repositorios/repositorioPrivacidad');
const Usuario = require('../src/modelos/Usuario');
const { ROLES } = require('../src/constantes/roles');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function preguntar(texto) {
  return new Promise((resolve) => rl.question(texto, (respuesta) => resolve(String(respuesta).trim())));
}

/** Oculta la contrasena mientras se escribe (cuando la terminal lo permite). */
function preguntarOculto(texto) {
  return new Promise((resolve) => {
    const salidaOriginal = process.stdout.write.bind(process.stdout);
    process.stdout.write = () => true;
    rl.question(texto, (respuesta) => {
      process.stdout.write = salidaOriginal;
      process.stdout.write('\n');
      resolve(String(respuesta).trim());
    });
  });
}

async function ejecutar() {
  console.log('');
  console.log('====================================================');
  console.log('  Crear administrador inicial de EMI Connect');
  console.log('====================================================');
  console.log('');

  const nombres = process.env.ADMIN_NOMBRES || (await preguntar('Nombres: '));
  const apellidos = process.env.ADMIN_APELLIDOS || (await preguntar('Apellidos: '));
  const correo = process.env.ADMIN_CORREO || (await preguntar('Correo institucional: '));
  const contrasena = process.env.ADMIN_CONTRASENA || (await preguntarOculto('Contrasena: '));

  if (!nombres || !apellidos || !correo || !contrasena) {
    throw new Error('Todos los datos son obligatorios.');
  }
  if (!correo.toLowerCase().endsWith(variablesEntorno.dominioInstitucional)) {
    throw new Error(`El correo debe pertenecer al dominio institucional ${variablesEntorno.dominioInstitucional}.`);
  }
  if (contrasena.length < 8) {
    throw new Error('La contrasena debe tener al menos 8 caracteres.');
  }

  await conectarBaseDatos();

  const existente = await repositorioUsuario.buscarPorCorreo(correo);
  if (existente) {
    // Si la cuenta ya existe se promueve a administrador y se verifica.
    const actualizado = await repositorioUsuario.actualizarPorId(existente._id, {
      rol: ROLES.ADMINISTRADOR,
      verificado: true,
      activo: true,
      bloqueado: false,
    });
    console.log('');
    console.log(`La cuenta ${actualizado.correo} ya existia y ahora tiene rol de administrador.`);
  } else {
    const contrasenaCifrada = await Usuario.cifrarContrasena(contrasena);
    const administrador = await repositorioUsuario.crear({
      nombres,
      apellidos,
      correo: correo.toLowerCase(),
      contrasena: contrasenaCifrada,
      rol: ROLES.ADMINISTRADOR,
      verificado: true,
      activo: true,
      carrera: 'Administracion',
      descripcion: 'Cuenta administrativa de EMI Connect.',
    });

    await repositorioPrivacidad.obtenerOCrear(administrador._id);

    console.log('');
    console.log('Administrador creado correctamente:');
    console.log(`  Correo: ${administrador.correo}`);
    console.log(`  Rol:    ${administrador.rol}`);
  }

  console.log('');
  console.log('Ya puedes iniciar sesion y acceder a /administracion.');
  console.log('');
}

ejecutar()
  .catch((error) => {
    console.error('');
    console.error('No se pudo crear el administrador:', error.message);
    console.error('');
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    await desconectarBaseDatos();
  });
