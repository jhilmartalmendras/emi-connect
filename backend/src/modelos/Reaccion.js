const mongoose = require('mongoose');
const { TIPOS_REACCION } = require('../constantes/catalogos');

const { Schema } = mongoose;

/**
 * Reaccion polimorfica: puede aplicarse a una publicacion o a un comentario.
 * El indice unico garantiza una sola reaccion por usuario y objetivo;
 * al cambiar de reaccion se actualiza el tipo en lugar de crear otra fila.
 */
const reaccionSchema = new Schema(
  {
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    objetivo: { type: Schema.Types.ObjectId, required: true, refPath: 'objetivoModelo' },
    objetivoModelo: { type: String, required: true, enum: ['Publicacion', 'Comentario'] },
    tipo: { type: String, required: true, enum: TIPOS_REACCION },
  },
  {
    timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
    collection: 'reacciones',
  }
);

reaccionSchema.index({ usuario: 1, objetivo: 1 }, { unique: true });
reaccionSchema.index({ objetivo: 1, tipo: 1 });

module.exports = mongoose.model('Reaccion', reaccionSchema);
