/**
 * Script de datos iniciales de EMI Connect.
 *
 * Uso:
 *   npm run sembrar
 *
 * Crea usuarios, comunidades, publicaciones, eventos y productos de PRUEBA.
 * Las cuentas usan correos institucionales de ejemplo y contrasenas de prueba
 * claramente identificadas (no son credenciales reales).
 */
const { conectarBaseDatos, desconectarBaseDatos } = require('../src/config/baseDatos');
const { variablesEntorno } = require('../src/config/variablesEntorno');
const Usuario = require('../src/modelos/Usuario');
const { repositorioUsuario } = require('../src/repositorios/repositorioUsuario');
const { repositorioPrivacidad } = require('../src/repositorios/repositorioPrivacidad');
const { repositorioComunidad } = require('../src/repositorios/repositorioComunidad');
const { repositorioMiembroComunidad } = require('../src/repositorios/repositorioMiembroComunidad');
const { repositorioPublicacion } = require('../src/repositorios/repositorioPublicacion');
const { repositorioComentario } = require('../src/repositorios/repositorioComentario');
const { repositorioAmistad } = require('../src/repositorios/repositorioAmistad');
const { repositorioEvento } = require('../src/repositorios/repositorioEvento');
const { repositorioAsistenciaEvento } = require('../src/repositorios/repositorioAsistenciaEvento');
const { repositorioProducto } = require('../src/repositorios/repositorioProducto');
const { repositorioNotificacion } = require('../src/repositorios/repositorioNotificacion');
const { configuracionInstitucional } = require('../src/config/institucional');
const { ROLES } = require('../src/constantes/roles');
const { sumarDias } = require('../src/utilidades/fechas');

// Contrasena unica de prueba para todas las cuentas sembradas.
const CONTRASENA_PRUEBA = 'EmiConnect2026';

async function limpiarDatosDePrueba(correos) {
  const usuarios = await Promise.all(correos.map((correo) => repositorioUsuario.buscarPorCorreo(correo)));

  for (const usuario of usuarios) {
    if (!usuario) continue;

    const publicaciones = await repositorioPublicacion.listarPorAutor(usuario._id, { limite: 200 });
    for (const publicacion of publicaciones) {
      await repositorioComentario.eliminarPorPublicacion(publicacion._id);
      await repositorioPublicacion.eliminarPorId(publicacion._id);
    }

    const comunidades = await repositorioMiembroComunidad.listarIdsComunidadesDeUsuario(usuario._id);
    for (const registro of comunidades) {
      await repositorioComunidad.eliminarPorId(registro.comunidad);
    }

    await repositorioMiembroComunidad.eliminarPorUsuario(usuario._id);
    await repositorioAmistad.eliminarDeUsuario(usuario._id);
    await repositorioNotificacion.eliminarPorUsuario(usuario._id);
    await repositorioPrivacidad.eliminarPorUsuario(usuario._id);
    await repositorioUsuario.eliminarPorId(usuario._id);
  }
}

async function crearUsuario(datos) {
  const existente = await repositorioUsuario.buscarPorCorreo(datos.correo);
  if (existente) return existente;

  const contrasenaCifrada = await Usuario.cifrarContrasena(CONTRASENA_PRUEBA);
  const usuario = await repositorioUsuario.crear({
    ...datos,
    contrasena: contrasenaCifrada,
    verificado: true,
    activo: true,
  });
  await repositorioPrivacidad.obtenerOCrear(usuario._id);
  return usuario;
}

async function ejecutar() {
  console.log('');
  console.log('====================================================');
  console.log('  Datos de prueba de EMI Connect');
  console.log('====================================================');
  console.log('');

  await conectarBaseDatos();

  const dominio = variablesEntorno.dominioInstitucional;
  const correosPrueba = [
    `ana.quispe${dominio}`,
    `carlos.mamani${dominio}`,
    `lucia.rojas${dominio}`,
    `diego.fernandez${dominio}`,
    `maria.torrez${dominio}`,
  ];

  await limpiarDatosDePrueba(correosPrueba);
  console.log('Datos de prueba anteriores eliminados.');

  // ---------------------------------------------------------------- Usuarios
  const [ana, carlos, lucia, diego, maria] = await Promise.all([
    crearUsuario({
      nombres: 'Ana',
      apellidos: 'Quispe Rojas',
      correo: `ana.quispe${dominio}`,
      rol: ROLES.ESTUDIANTE,
      carrera: 'Ingenieria de Sistemas',
      semestre: 8,
      unidadAcademica: 'Unidad Academica La Paz',
      descripcion: 'Estudiante de Ingenieria de Sistemas interesada en inteligencia artificial.',
      intereses: ['Inteligencia Artificial', 'Desarrollo de Software', 'Robotica'],
    }),
    crearUsuario({
      nombres: 'Carlos',
      apellidos: 'Mamani Choque',
      correo: `carlos.mamani${dominio}`,
      rol: ROLES.DOCENTE,
      carrera: 'Ingenieria de Sistemas',
      semestre: null,
      unidadAcademica: 'Unidad Academica La Paz',
      descripcion: 'Docente de la carrera de Ingenieria de Sistemas. Investigacion en redes.',
      intereses: ['Redes y Telecomunicaciones', 'Investigacion', 'Ciberseguridad'],
    }),
    crearUsuario({
      nombres: 'Lucia',
      apellidos: 'Rojas Vargas',
      correo: `lucia.rojas${dominio}`,
      rol: ROLES.ESTUDIANTE,
      carrera: 'Ingenieria Civil',
      semestre: 6,
      unidadAcademica: 'Unidad Academica Cochabamba',
      descripcion: 'Estudiante de Ingenieria Civil apasionada por las estructuras.',
      intereses: ['Estructuras', 'Geotecnia', 'Deportes'],
    }),
    crearUsuario({
      nombres: 'Diego',
      apellidos: 'Fernandez Lima',
      correo: `diego.fernandez${dominio}`,
      rol: ROLES.ESTUDIANTE,
      carrera: 'Ingenieria Mecanica',
      semestre: 4,
      unidadAcademica: 'Unidad Academica Santa Cruz',
      descripcion: 'Estudiante de Ingenieria Mecanica, miembro del club de robotica.',
      intereses: ['Robotica', 'Energias Renovables', 'Emprendimiento'],
    }),
    crearUsuario({
      nombres: 'Maria',
      apellidos: 'Torrez Salazar',
      correo: `maria.torrez${dominio}`,
      rol: ROLES.ADMINISTRATIVO,
      carrera: 'Ingenieria Industrial',
      semestre: null,
      unidadAcademica: 'Unidad Academica La Paz',
      descripcion: 'Personal administrativo. Coordinacion academica.',
      intereses: ['Investigacion', 'Cultura'],
    }),
  ]);

  console.log(`Usuarios creados: ${[ana, carlos, lucia, diego, maria].filter(Boolean).length}`);

  // ---------------------------------------------------------------- Amistades
  const relaciones = [
    [ana, carlos, 'aceptada'],
    [ana, lucia, 'aceptada'],
    [carlos, diego, 'aceptada'],
    [maria, ana, 'pendiente'],
  ];

  for (const [solicitante, receptor, estado] of relaciones) {
    if (!solicitante || !receptor) continue;
    await repositorioAmistad.crear({
      solicitante: solicitante._id,
      receptor: receptor._id,
      estado,
      fechaRespuesta: estado === 'aceptada' ? new Date() : null,
    });
  }

  await Promise.all([
    repositorioUsuario.actualizarPorId(ana._id, { cantidadAmigos: 2 }),
    repositorioUsuario.actualizarPorId(carlos._id, { cantidadAmigos: 2 }),
    repositorioUsuario.actualizarPorId(lucia._id, { cantidadAmigos: 1 }),
    repositorioUsuario.actualizarPorId(diego._id, { cantidadAmigos: 1 }),
  ]);

  // ---------------------------------------------------------------- Comunidades
  const comunidadesCreadas = [];
  const datosComunidades = [
    {
      nombre: 'Ingenieria de Sistemas EMI',
      descripcion: 'Espacio de la carrera de Ingenieria de Sistemas: proyectos, avisos y recursos.',
      categoria: 'carrera',
      creador: ana,
      reglas: ['Respeto entre miembros', 'Publicar contenido academico', 'No compartir material con derechos'],
    },
    {
      nombre: 'Robotica EMI',
      descripcion: 'Club de robotica: armado de prototipos, competencias y talleres.',
      categoria: 'club',
      creador: diego,
      reglas: ['Compartir avances de proyectos', 'Ayudar a los nuevos miembros'],
    },
    {
      nombre: 'Inteligencia Artificial',
      descripcion: 'Comunidad de estudio sobre machine learning, vision por computadora y NLP.',
      categoria: 'academica',
      creador: carlos,
      reglas: ['Citar fuentes', 'Compartir material de estudio'],
    },
    {
      nombre: '8vo Semestre Sistemas',
      descripcion: 'Grupo del octavo semestre para coordinar materias y proyectos finales.',
      categoria: 'semestre',
      creador: ana,
      reglas: ['Coordinar trabajos de grado'],
    },
    {
      nombre: 'Centro de Estudiantes EMI',
      descripcion: 'Informacion oficial del centro de estudiantes y actividades.',
      categoria: 'institucional',
      creador: maria,
      reglas: ['Solo publicaciones informativas'],
    },
  ];

  for (const datos of datosComunidades) {
    const comunidad = await repositorioComunidad.crear({
      ...datos,
      cantidadMiembros: 1,
    });

    await repositorioMiembroComunidad.crear({
      comunidad: comunidad._id,
      usuario: datos.creador._id,
      rol: 'administrador',
    });

    comunidadesCreadas.push(comunidad);
  }

  // Se agregan miembros a las comunidades.
  const membresias = [
    [comunidadesCreadas[0], [carlos, lucia]],
    [comunidadesCreadas[1], [ana, carlos]],
    [comunidadesCreadas[2], [ana, diego, maria]],
    [comunidadesCreadas[3], [lucia]],
    [comunidadesCreadas[4], [ana, carlos]],
  ];

  for (const [comunidad, usuarios] of membresias) {
    for (const usuario of usuarios) {
      await repositorioMiembroComunidad.crear({
        comunidad: comunidad._id,
        usuario: usuario._id,
        rol: 'miembro',
      });
      await repositorioUsuario.incrementarCampos(usuario._id, { cantidadComunidades: 1 });
    }
    await repositorioComunidad.incrementarCampos(comunidad._id, { cantidadMiembros: usuarios.length });
  }

  console.log(`Comunidades creadas: ${comunidadesCreadas.length}`);

  // ---------------------------------------------------------------- Publicaciones
  const publicaciones = [
    {
      contenido:
        'Bienvenidos a EMI Connect. Esta plataforma fue creada para que la comunidad de la Escuela Militar de Ingenieria comparta informacion academica y pueda comunicarse de forma directa.',
      categoria: 'institucional',
      autor: maria,
      esInstitucional: true,
    },
    {
      contenido:
        'Estamos organizando un taller de machine learning para el proximo mes. Si te interesa participar, responde a esta publicacion y te enviaremos los detalles.',
      categoria: 'academica',
      autor: carlos,
      comunidad: comunidadesCreadas[2],
    },
    {
      contenido: 'Aqui subo el resumen del laboratorio de estructuras de esta semana. Cualquier duda la vemos en clase.',
      categoria: 'academica',
      autor: lucia,
    },
    {
      contenido: 'Terminamos el prototipo del robot seguidor de linea. Gracias al equipo de Robotica EMI por el apoyo.',
      categoria: 'logro',
      autor: diego,
      comunidad: comunidadesCreadas[1],
    },
    {
      contenido: '?Alguien tiene apuntes de Redes II? Me gustaria repasar antes del examen.',
      categoria: 'pregunta',
      autor: ana,
      comunidad: comunidadesCreadas[0],
    },
    {
      contenido: 'Comparto la grabacion de la charla sobre ciberseguridad. Excelente exposicion del ingeniero invitado.',
      categoria: 'general',
      autor: carlos,
    },
  ];

  const publicacionesCreadas = [];
  for (const datos of publicaciones) {
    const publicacion = await repositorioPublicacion.crear({
      autor: datos.autor._id,
      contenido: datos.contenido,
      categoria: datos.categoria,
      esInstitucional: Boolean(datos.esInstitucional),
      comunidad: datos.comunidad ? datos.comunidad._id : null,
      reaccionesResumen: { me_gusta: 0, me_encanta: 0, me_divierte: 0, me_sorprende: 0, me_entristece: 0, me_enoja: 0 },
    });

    await repositorioUsuario.incrementarCampos(datos.autor._id, { cantidadPublicaciones: 1 });
    if (datos.comunidad) {
      await repositorioComunidad.incrementarCampos(datos.comunidad._id, { cantidadPublicaciones: 1 });
    }

    publicacionesCreadas.push(publicacion);
  }

  // Comentarios de ejemplo en la primera publicacion.
  const comentarios = await Promise.all([
    repositorioComentario.crear({
      publicacion: publicacionesCreadas[0]._id,
      autor: ana._id,
      contenido: 'Excelente iniciativa. Ya estamos usando la plataforma con mis companeros.',
      nivel: 1,
    }),
    repositorioComentario.crear({
      publicacion: publicacionesCreadas[0]._id,
      autor: carlos._id,
      contenido: 'Muy util para mantener informados a los estudiantes de todas las unidades academicas.',
      nivel: 1,
    }),
  ]);

  await repositorioPublicacion.incrementarCampos(publicacionesCreadas[0]._id, { cantidadComentarios: 2 });

  // Respuesta anidada al primer comentario.
  await repositorioComentario.crear({
    publicacion: publicacionesCreadas[0]._id,
    autor: maria._id,
    contenido: 'Gracias Ana, cualquier sugerencia es bienvenida.',
    nivel: 2,
    comentarioPadre: comentarios[0]._id,
    respondeA: ana._id,
  });
  await repositorioComentario.incrementarCampos(comentarios[0]._id, { cantidadRespuestas: 1 });
  await repositorioPublicacion.incrementarCampos(publicacionesCreadas[0]._id, { cantidadComentarios: 1 });

  console.log(`Publicaciones creadas: ${publicacionesCreadas.length}`);

  // ---------------------------------------------------------------- Eventos
  const eventos = [
    {
      nombre: 'Feria de tecnologia EMI',
      descripcion: 'Presentacion de proyectos de estudiantes de todas las carreras.',
      fecha: sumarDias(7),
      ubicacion: 'Patio central - Unidad Academica La Paz',
      organizador: maria,
      cupos: 120,
      esInstitucional: true,
      comunidad: comunidadesCreadas[4],
    },
    {
      nombre: 'Taller de robotica basica',
      descripcion: 'Taller practico para armar un robot seguidor de linea.',
      fecha: sumarDias(3),
      ubicacion: 'Laboratorio de Robotica',
      organizador: diego,
      cupos: 25,
      comunidad: comunidadesCreadas[1],
    },
    {
      nombre: 'Charla: introduccion al machine learning',
      descripcion: 'Conceptos basicos de aprendizaje automatico y aplicaciones en ingenieria.',
      fecha: sumarDias(5),
      ubicacion: 'Auditorio 2',
      organizador: carlos,
      cupos: 60,
      comunidad: comunidadesCreadas[2],
    },
  ];

  const eventosCreados = [];
  for (const datos of eventos) {
    const evento = await repositorioEvento.crear({
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      fecha: datos.fecha,
      ubicacion: datos.ubicacion,
      organizador: datos.organizador._id,
      comunidad: datos.comunidad ? datos.comunidad._id : null,
      cupos: datos.cupos,
      esInstitucional: Boolean(datos.esInstitucional),
      cantidadAsistentes: 1,
    });

    await repositorioAsistenciaEvento.crearOActualizar({
      evento: evento._id,
      usuario: datos.organizador._id,
      estado: 'asistire',
    });

    eventosCreados.push(evento);
  }

  await Promise.all([
    repositorioAsistenciaEvento.crearOActualizar({
      evento: eventosCreados[0]._id,
      usuario: ana._id,
      estado: 'asistire',
    }),
    repositorioAsistenciaEvento.crearOActualizar({
      evento: eventosCreados[1]._id,
      usuario: ana._id,
      estado: 'interesado',
    }),
  ]);
  await repositorioEvento.incrementarCampos(eventosCreados[0]._id, { cantidadAsistentes: 1 });
  await repositorioEvento.incrementarCampos(eventosCreados[1]._id, { cantidadInteresados: 1 });

  console.log(`Eventos creados: ${eventosCreados.length}`);

  // ---------------------------------------------------------------- Productos
  const productos = [
    {
      vendedor: ana,
      titulo: 'Calculadora cientifica Casio fx-991',
      descripcion: 'Calculadora en excelente estado, ideal para ingenieria. Incluye estuche.',
      precio: 180,
      categoria: 'electronica',
      ubicacion: 'La Paz',
    },
    {
      vendedor: lucia,
      titulo: 'Libro: Analisis estructural (Hibbeler)',
      descripcion: 'Libro de analisis estructural en buen estado, sin subrayados.',
      precio: 120,
      categoria: 'libros',
      ubicacion: 'Cochabamba',
    },
    {
      vendedor: diego,
      titulo: 'Kit Arduino basico',
      descripcion: 'Kit con placa Arduino Uno, sensores y cables. Practicamente nuevo.',
      precio: 250,
      categoria: 'electronica',
      ubicacion: 'Santa Cruz',
    },
  ];

  for (const datos of productos) {
    await repositorioProducto.crear({
      vendedor: datos.vendedor._id,
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      precio: datos.precio,
      categoria: datos.categoria,
      ubicacion: datos.ubicacion,
      estado: 'disponible',
    });
  }

  console.log(`Productos creados: ${productos.length}`);

  // ---------------------------------------------------------------- Notificaciones
  await repositorioNotificacion.crear({
    usuario: ana._id,
    actor: maria._id,
    tipo: 'solicitud_amistad',
    titulo: 'Nueva solicitud de amistad',
    mensaje: 'Tienes una nueva solicitud de amistad en EMI Connect.',
    enlace: '/amigos',
  });

  console.log('');
  console.log('====================================================');
  console.log('  Datos de prueba cargados correctamente');
  console.log('====================================================');
  console.log('  Cuentas de prueba (contrasena unica de prueba):');
  correosPrueba.forEach((correo) => console.log(`   - ${correo}`));
  console.log(`  Contrasena de prueba: ${CONTRASENA_PRUEBA}`);
  console.log('');
  console.log('  NOTA: estas credenciales son solo para pruebas locales.');
  console.log('====================================================');
  console.log('');
}

ejecutar()
  .catch((error) => {
    console.error('');
    console.error('No se pudieron cargar los datos de prueba:', error.message);
    console.error(error.stack);
    process.exitCode = 1;
  })
  .finally(async () => {
    await desconectarBaseDatos();
  });
