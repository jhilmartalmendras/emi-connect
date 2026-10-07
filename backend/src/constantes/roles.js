/**
 * Roles del sistema EMI Connect.
 * El rol determina que acciones puede ejecutar un usuario en la plataforma.
 */
const ROLES = {
  ESTUDIANTE: 'estudiante',
  DOCENTE: 'docente',
  ADMINISTRATIVO: 'administrativo',
  MODERADOR: 'moderador',
  ADMINISTRADOR: 'administrador',
};

const LISTA_ROLES = Object.values(ROLES);

// Roles con acceso al panel administrativo.
const ROLES_ADMINISTRACION = [ROLES.ADMINISTRADOR, ROLES.MODERADOR];

// Roles autorizados a emitir publicaciones institucionales oficiales.
const ROLES_INSTITUCIONALES = [ROLES.ADMINISTRADOR, ROLES.DOCENTE, ROLES.ADMINISTRATIVO];

// Roles autorizados a publicar contenido academico.
const ROLES_ACADEMICOS = [ROLES.DOCENTE, ROLES.ADMINISTRADOR, ROLES.ADMINISTRATIVO];

// Roles autorizados a crear eventos institucionales.
const ROLES_CREADORES_EVENTOS = [ROLES.DOCENTE, ROLES.ADMINISTRATIVO, ROLES.ADMINISTRADOR];

function esRolAdministracion(rol) {
  return ROLES_ADMINISTRACION.includes(rol);
}

function puedePublicarInstitucional(rol) {
  return ROLES_INSTITUCIONALES.includes(rol);
}

module.exports = {
  ROLES,
  LISTA_ROLES,
  ROLES_ADMINISTRACION,
  ROLES_INSTITUCIONALES,
  ROLES_ACADEMICOS,
  ROLES_CREADORES_EVENTOS,
  esRolAdministracion,
  puedePublicarInstitucional,
};
