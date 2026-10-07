const { Router } = require('express');
const { controladorUsuario } = require('../controladores/controladorUsuario');
const { autenticar, autenticacionOpcional } = require('../middlewares/autenticacion');
const { validarCampos } = require('../middlewares/validacion');
const { crearSubida, validarFirmaArchivos } = require('../middlewares/subidaArchivos');
const { limitadorSubidas, limitadorEscritura } = require('../middlewares/limitadores');
const { validarActualizacionPerfil, validarPrivacidad, validarBloqueo } = require('../validaciones/validacionesUsuario');
const { validarIdentificador, validarPaginacion } = require('../validaciones/validacionesComunes');

const enrutador = Router();

// Rutas propias del usuario autenticado (deben ir antes de /:id)
enrutador.get('/mi-perfil', autenticar, controladorUsuario.obtenerMiPerfil);
enrutador.put(
  '/mi-perfil',
  autenticar,
  limitadorEscritura,
  validarActualizacionPerfil,
  validarCampos,
  controladorUsuario.actualizarMiPerfil
);
enrutador.delete('/mi-perfil', autenticar, controladorUsuario.eliminarMiCuenta);

enrutador.post(
  '/mi-perfil/foto',
  autenticar,
  limitadorSubidas,
  crearSubida('perfiles'),
  validarFirmaArchivos('perfiles'),
  controladorUsuario.subirFotoPerfil
);
enrutador.post(
  '/mi-perfil/portada',
  autenticar,
  limitadorSubidas,
  crearSubida('perfiles'),
  validarFirmaArchivos('perfiles'),
  controladorUsuario.subirFotoPortada
);

// Privacidad
enrutador.get('/privacidad', autenticar, controladorUsuario.obtenerPrivacidad);
enrutador.put('/privacidad', autenticar, validarPrivacidad, validarCampos, controladorUsuario.actualizarPrivacidad);

// Bloqueos
enrutador.get('/bloqueos', autenticar, controladorUsuario.listarBloqueados);
enrutador.post(
  '/bloqueos/:id',
  autenticar,
  validarIdentificador(),
  validarBloqueo,
  validarCampos,
  controladorUsuario.bloquearUsuario
);
enrutador.delete(
  '/bloqueos/:id',
  autenticar,
  validarIdentificador(),
  validarCampos,
  controladorUsuario.desbloquearUsuario
);

// Directorio y perfil publico
enrutador.get('/', autenticacionOpcional, validarPaginacion, validarCampos, controladorUsuario.listarUsuarios);
enrutador.get('/perfil/:id', autenticacionOpcional, validarIdentificador(), validarCampos, controladorUsuario.obtenerPerfil);

module.exports = { rutasUsuarios: enrutador };
