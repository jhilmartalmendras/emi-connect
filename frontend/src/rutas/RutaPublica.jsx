import { Navigate } from 'react-router-dom';
import { CargadorPantallaCompleta } from '../componentes/comunes/Cargador';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';

/**
 * Ruta accesible solo sin sesion (login, registro, recuperacion).
 * Con sesion activa redirige al inicio.
 */
export function RutaPublica({ children }) {
  const { autenticado, cargando } = useAutenticacion();

  if (cargando) return <CargadorPantallaCompleta />;

  if (autenticado) return <Navigate to="/inicio" replace />;

  return children;
}

export default RutaPublica;
