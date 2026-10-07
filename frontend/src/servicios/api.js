import axios from 'axios';

const URL_API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/** Clave del token en el almacenamiento local del navegador. */
export const CLAVE_TOKEN = 'emi_connect_token';
export const CLAVE_USUARIO = 'emi_connect_usuario';

/** Cliente axios reutilizado por todos los servicios. */
const api = axios.create({
  baseURL: URL_API,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

/** Se ejecuta cuando el token deja de ser valido para cerrar la sesion. */
let alExpirarSesion = null;

export function configurarManejadorSesionExpirada(fn) {
  alExpirarSesion = fn;
}

// ---------------------------------------------------------------- Interceptores
api.interceptors.request.use((configuracion) => {
  const token = localStorage.getItem(CLAVE_TOKEN);
  if (token) {
    configuracion.headers.Authorization = `Bearer ${token}`;
  }
  return configuracion;
});

api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const estado = error.response?.status;

    // Token expirado o invalido: se limpia la sesion y se avisa al contexto.
    if (estado === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem(CLAVE_TOKEN);
      localStorage.removeItem(CLAVE_USUARIO);
      if (alExpirarSesion) alExpirarSesion();
    }

    // Mensaje comprensible para el usuario (nunca detalles tecnicos).
    const mensaje =
      error.response?.data?.mensaje ||
      (error.code === 'ECONNABORTED'
        ? 'La peticion tardo demasiado. Verifica tu conexion e intenta nuevamente.'
        : 'No pudimos conectar con el servidor de EMI Connect. Intenta nuevamente.');

    const errores = error.response?.data?.errores || [];

    return Promise.reject({ mensaje, errores, estado, original: error });
  }
);

/** Envia archivos con FormData (subida de imagenes). */
export function crearFormulario(datos) {
  const formulario = new FormData();
  Object.entries(datos).forEach(([clave, valor]) => {
    if (valor === undefined || valor === null) return;
    if (Array.isArray(valor)) {
      valor.forEach((elemento) => formulario.append(clave, elemento));
    } else {
      formulario.append(clave, valor);
    }
  });
  return formulario;
}

export default api;
