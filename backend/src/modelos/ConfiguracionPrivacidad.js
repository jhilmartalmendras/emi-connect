const mongoose = require('mongoose');
const { NIVELES_PRIVACIDAD } = require('../constantes/catalogos');

const { Schema } = mongoose;

/**
 * Configuracion de privacidad de cada usuario.
 * Se mantiene en una coleccion aparte para no cargar estos datos en cada
 * consulta de usuario y para poder evolucionar sin migrar el perfil.
 */
const configuracionPrivacidadSchema = new Schema(
  {
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, unique: true, index: true },

    visibilidadPerfil: { type: String, enum: NIVELES_PRIVACIDAD, default: 'miembros_emi' },
    visibilidadPublicaciones: { type: String, enum: NIVELES_PRIVACIDAD, default: 'miembros_emi' },

    // Quien puede interactuar con el usuario.
    quienPuedeEnviarSolicitudes: { type: String, enum: NIVELES_PRIVACIDAD, default: 'miembros_emi' },
    quienPuedeEnviarMensajes: { type: String, enum: NIVELES_PRIVACIDAD, default: 'miembros_emi' },
    quienPuedeVerAmigos: { type: String, enum: NIVELES_PRIVACIDAD, default: 'miembros_emi' },
    quienPuedeVerComunidades: { type: String, enum: NIVELES_PRIVACIDAD, default: 'miembros_emi' },

    // Preferencias adicionales.
    mostrarCorreo: { type: Boolean, default: false },
    mostrarSemestre: { type: Boolean, default: true },
    permitirEtiquetas: { type: Boolean, default: true },
    aparecerEnBusquedas: { type: Boolean, default: true },
    recibirNotificaciones: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
    collection: 'configuraciones_privacidad',
  }
);

module.exports = mongoose.model('ConfiguracionPrivacidad', configuracionPrivacidadSchema);
