/**
 * Configuracion institucional de EMI Connect.
 *
 * IMPORTANTE: Estos datos son configuraciones EDITABLES. No se inventan datos
 * oficiales: los valores cargados son ejemplos identificados que deben
 * reemplazarse por la informacion oficial de la Escuela Militar de Ingenieria.
 * Modificar unicamente este archivo para actualizar carreras, unidades
 * academicas o categorias del marketplace.
 */
const configuracionInstitucional = {
  nombrePlataforma: 'EMI Connect',
  nombreInstitucion: 'Escuela Militar de Ingenieria',
  siglasInstitucion: 'EMI',

  // Unidades academicas (datos de ejemplo editables).
  unidadesAcademicas: [
    { codigo: 'LA_PAZ', nombre: 'Unidad Academica La Paz' },
    { codigo: 'COCHABAMBA', nombre: 'Unidad Academica Cochabamba' },
    { codigo: 'SANTA_CRUZ', nombre: 'Unidad Academica Santa Cruz' },
    { codigo: 'TROPICO', nombre: 'Unidad Academica del Tropico' },
    { codigo: 'ORURO', nombre: 'Unidad Academica Oruro' },
    { codigo: 'SUCRE', nombre: 'Unidad Academica Sucre' },
  ],

  // Carreras (datos de ejemplo editables).
  carreras: [
    'Ingenieria de Sistemas',
    'Ingenieria Civil',
    'Ingenieria Industrial',
    'Ingenieria Mecanica',
    'Ingenieria Electrica',
    'Ingenieria Electronica',
    'Ingenieria Geografica',
    'Ingenieria Petrolera',
    'Ingenieria Quimica',
    'Arquitectura',
  ],

  // Semestres disponibles.
  semestres: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],

  // Intereses sugeridos para el perfil y el motor de recomendaciones.
  intereses: [
    'Inteligencia Artificial',
    'Robotica',
    'Desarrollo de Software',
    'Redes y Telecomunicaciones',
    'Ciberseguridad',
    'Estructuras',
    'Geotecnia',
    'Hidraulica',
    'Energias Renovables',
    'Investigacion',
    'Deportes',
    'Cultura',
    'Emprendimiento',
  ],
};

module.exports = { configuracionInstitucional };
