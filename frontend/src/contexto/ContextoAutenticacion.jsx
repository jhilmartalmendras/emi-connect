import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { servicioAutenticacion } from '../servicios/servicioAutenticacion';
import { CLAVE_TOKEN, CLAVE_USUARIO, configurarManejadorSesionExpirada } from '../servicios/api';

const ContextoAutenticacion = createContext(null);

const ROLES_ADMINISTRACION = ['administrador', 'moderador'];

/** Lee el usuario guardado en el navegador (para no perder la sesion al recargar). */
function leerUsuarioGuardado() {
  try {
    const texto = localStorage.getItem(CLAVE_USUARIO);
    return texto ? JSON.parse(texto) : null;
  } catch (error) {
    return null;
  }
}

export function ProveedorAutenticacion({ children }) {
  const [usuario, setUsuario] = useState(leerUsuarioGuardado);
  const [cargando, setCargando] = useState(true);
  const [sesionExpirada, setSesionExpirada] = useState(false);

  /** Guarda el token y los datos del usuario en el navegador. */
  const guardarSesion = useCallback((token, datosUsuario) => {
    localStorage.setItem(CLAVE_TOKEN, token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(datosUsuario));
    setUsuario(datosUsuario);
    setSesionExpirada(false);
  }, []);

  /** Limpia la sesion local por completo. */
  const limpiarSesion = useCallback((expirada = false) => {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    setUsuario(null);
    setSesionExpirada(expirada);
  }, []);

  // Cuando la API responde 401 se cierra la sesion y se avisa en la interfaz.
  useEffect(() => {
    configurarManejadorSesionExpirada(() => limpiarSesion(true));
  }, [limpiarSesion]);

  // Al cargar la aplicacion se valida el token contra el backend.
  useEffect(() => {
    let activo = true;

    async function validarSesion() {
      const token = localStorage.getItem(CLAVE_TOKEN);
      if (!token) {
        setCargando(false);
        return;
      }

      try {
        const datos = await servicioAutenticacion.obtenerSesion();
        if (!activo) return;
        localStorage.setItem(CLAVE_USUARIO, JSON.stringify(datos.usuario));
        setUsuario(datos.usuario);
      } catch (error) {
        if (!activo) return;
        // Token expirado o cuenta no habilitada: se cierra la sesion.
        limpiarSesion(true);
      } finally {
        if (activo) setCargando(false);
      }
    }

    validarSesion();
    return () => {
      activo = false;
    };
  }, [limpiarSesion]);

  const iniciarSesion = useCallback(
    async (correo, contrasena) => {
      const datos = await servicioAutenticacion.iniciarSesion(correo, contrasena);
      guardarSesion(datos.token, datos.usuario);
      return datos.usuario;
    },
    [guardarSesion]
  );

  const registrar = useCallback(async (datosRegistro) => {
    return servicioAutenticacion.registrar(datosRegistro);
  }, []);

  const cerrarSesion = useCallback(async () => {
    try {
      await servicioAutenticacion.cerrarSesion();
    } catch (error) {
      // Si el servidor no responde, la sesion local se cierra igual.
    }
    limpiarSesion(false);
  }, [limpiarSesion]);

  /** Actualiza los datos del usuario en memoria y en el almacenamiento local. */
  const actualizarUsuario = useCallback((cambios) => {
    setUsuario((actual) => {
      if (!actual) return actual;
      const actualizado = { ...actual, ...cambios };
      localStorage.setItem(CLAVE_USUARIO, JSON.stringify(actualizado));
      return actualizado;
    });
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      cargando,
      sesionExpirada,
      autenticado: Boolean(usuario),
      esAdministracion: usuario ? ROLES_ADMINISTRACION.includes(usuario.rol) : false,
      esAdministrador: usuario ? usuario.rol === 'administrador' : false,
      iniciarSesion,
      registrar,
      cerrarSesion,
      actualizarUsuario,
      limpiarSesion,
    }),
    [
      usuario,
      cargando,
      sesionExpirada,
      iniciarSesion,
      registrar,
      cerrarSesion,
      actualizarUsuario,
      limpiarSesion,
    ]
  );

  return <ContextoAutenticacion.Provider value={valor}>{children}</ContextoAutenticacion.Provider>;
}

/** Hook de acceso a la sesion. */
export function useAutenticacion() {
  const contexto = useContext(ContextoAutenticacion);
  if (!contexto) {
    throw new Error('useAutenticacion debe usarse dentro de ProveedorAutenticacion');
  }
  return contexto;
}
