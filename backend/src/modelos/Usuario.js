const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, LISTA_ROLES } = require('../constantes/roles');

const { Schema } = mongoose;

const usuarioSchema = new Schema(
  {
    nombres: { type: String, required: true, trim: true, maxlength: 80 },
    apellidos: { type: String, required: true, trim: true, maxlength: 80 },
    correo: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // La contrasena nunca se devuelve por defecto en las consultas.
    contrasena: { type: String, required: true, select: false },
    rol: { type: String, enum: LISTA_ROLES, default: ROLES.ESTUDIANTE, index: true },

    carrera: { type: String, trim: true, default: '' },
    semestre: { type: Number, min: 1, max: 12, default: null },
    unidadAcademica: { type: String, trim: true, default: '' },
    descripcion: { type: String, trim: true, maxlength: 500, default: '' },
    intereses: { type: [String], default: [] },

    fotoPerfil: { type: String, default: '' },
    fotoPortada: { type: String, default: '' },

    verificado: { type: Boolean, default: false, index: true },
    activo: { type: Boolean, default: true, index: true },
    bloqueado: { type: Boolean, default: false },
    motivoBloqueo: { type: String, default: '' },
    cuentaEliminada: { type: Boolean, default: false },

    // Indicadores de actividad usados por el panel administrativo y las recomendaciones.
    cantidadPublicaciones: { type: Number, default: 0 },
    cantidadAmigos: { type: Number, default: 0 },
    cantidadComunidades: { type: Number, default: 0 },
    fechaUltimaConexion: { type: Date, default: null },

    aceptaNotificacionesCorreo: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
    collection: 'usuarios',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indices para busquedas frecuentes.
usuarioSchema.index({ nombres: 1, apellidos: 1 });
usuarioSchema.index({ carrera: 1, semestre: 1 });
usuarioSchema.index({ nombres: 'text', apellidos: 'text', descripcion: 'text', intereses: 'text' });

// Nombre completo calculado, util para la interfaz.
usuarioSchema.virtual('nombreCompleto').get(function nombreCompleto() {
  return `${this.nombres} ${this.apellidos}`.trim();
});

/** Cifra una contrasena en texto plano. */
usuarioSchema.statics.cifrarContrasena = async function cifrarContrasena(contrasenaPlano) {
  const sal = await bcrypt.genSalt(10);
  return bcrypt.hash(contrasenaPlano, sal);
};

/** Compara una contrasena en texto plano con el hash almacenado. */
usuarioSchema.methods.compararContrasena = function compararContrasena(contrasenaPlano) {
  return bcrypt.compare(contrasenaPlano, this.contrasena);
};

/** Devuelve solo la informacion publica del usuario. */
usuarioSchema.methods.datosPublicos = function datosPublicos() {
  return {
    _id: this._id,
    nombres: this.nombres,
    apellidos: this.apellidos,
    nombreCompleto: `${this.nombres} ${this.apellidos}`.trim(),
    correo: this.correo,
    rol: this.rol,
    carrera: this.carrera,
    semestre: this.semestre,
    unidadAcademica: this.unidadAcademica,
    descripcion: this.descripcion,
    intereses: this.intereses,
    fotoPerfil: this.fotoPerfil,
    fotoPortada: this.fotoPortada,
    verificado: this.verificado,
    cantidadPublicaciones: this.cantidadPublicaciones,
    cantidadAmigos: this.cantidadAmigos,
    fechaCreacion: this.fechaCreacion,
  };
};

module.exports = mongoose.model('Usuario', usuarioSchema);
