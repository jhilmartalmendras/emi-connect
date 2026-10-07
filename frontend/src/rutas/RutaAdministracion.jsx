import { Navigate } from 'react-router-dom';
import { CargadorPantallaCompleta } from '../componentes/comunes/Cargador';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';

/**
 * Ruta reservada al panel administrativo (moderadores y administradores).
 * Sin sesion va al login; con sesion sin rol adecuado vuelve al inicio.
 */
export function RutaAdministracion({ children }) {
  const { autenticado, cargando, esAdministracion } = useAutenticacion();

  if (cargando) return <CargadorPantallaCompleta texto="Verificando permisos..." />;

  if (!autenticado) return <Navigate to="/login" replace />;

  if (!esAdministracion) return <Navigate to="/inicio" replace />;

  return children;
}

/**
 * Ruta reservada exclusivamente al administrador principal
 * (cambios de rol, eliminacion definitiva de cuentas).
 */
export function RutaAdministrador({ children }) {
  const { autenticado, cargando, esAdministrador } = useAutenticacion();

  if (cargando) return <CargadorPantallaCompleta texto="Verificando permisos..." />;

  if (!autenticado) return <Navigate to="/login" replace />;

  if (!esAdministrador) return <Navigate to="/administracion" replace />;

  return children;
}

export default RutaAdministracion;
