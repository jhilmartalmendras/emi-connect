const crypto = require('crypto');
const TokenVerificacion = require('../modelos/TokenVerificacion');
const { variablesEntorno } = require('../config/variablesEntorno');

/**
 * Genera el hash HMAC-SHA256 de un codigo.
 * Se usa HMAC (y no bcrypt) para poder buscar el codigo por indice sin guardarlo
 * en texto plano y manteniendo la comparacion en tiempo constante.
 */
function hashearCodigo(codigo) {
  return crypto.createHmac('sha256', variablesEntorno.jwt.secreto).update(String(codigo)).digest('hex');
}

function compararHash(hashAlmacenado, codigo) {
  const hashCalculado = hashearCodigo(codigo);
  const bufferA = Buffer.from(String(hashAlmacenado));
  const bufferB = Buffer.from(hashCalculado);
  if (bufferA.length !== bufferB.length) return false;
  return crypto.timingSafeEqual(bufferA, bufferB);
}

const repositorioToken = {
  hashearCodigo,
  compararHash,

  crear({ usuario, correo, codigo, tipo, minutosExpiracion = 15, maxIntentos = 5 }) {
    return TokenVerificacion.create({
      usuario,
      correo,
      codigoHash: hashearCodigo(codigo),
      tipo,
      maxIntentos,
      expiraEn: new Date(Date.now() + minutosExpiracion * 60 * 1000),
    });
  },

  /** Busca el token vigente (no usado y no expirado) por hash de codigo. */
  buscarVigentePorHash(codigoHash, tipo) {
    return TokenVerificacion.findOne({
      codigoHash,
      tipo,
      usado: false,
      expiraEn: { $gt: new Date() },
    }).exec();
  },

  buscarPorUsuario(usuarioId, tipo) {
    return TokenVerificacion.findOne({ usuario: usuarioId, tipo, usado: false })
      .sort({ fechaCreacion: -1 })
      .exec();
  },

  incrementarIntentos(id) {
    return TokenVerificacion.findByIdAndUpdate(id, { $inc: { intentos: 1 } }, { new: true }).exec();
  },

  marcarUsado(id) {
    return TokenVerificacion.findByIdAndUpdate(id, { usado: true, fechaUso: new Date() }, { new: true }).exec();
  },

  /** Invalida los tokens anteriores del mismo tipo antes de emitir uno nuevo. */
  invalidarAnteriores(usuarioId, tipo) {
    return TokenVerificacion.updateMany({ usuario: usuarioId, tipo, usado: false }, { usado: true }).exec();
  },

  eliminarPorUsuario(usuarioId) {
    return TokenVerificacion.deleteMany({ usuario: usuarioId }).exec();
  },

  contar(filtro = {}) {
    return TokenVerificacion.countDocuments(filtro);
  },
};

module.exports = { repositorioToken };
