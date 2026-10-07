import { Navigate, useLocation } from 'react-router-dom';
import { CargadorPantallaCompleta } from '../componentes/comunes/Cargador';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';

/**
 * Protege una ruta: exige sesion activa.
 * Mientras se valida el token muestra una pantalla de carga;
 * sin sesion redirige al login recordando la ruta solicitada.
 */
export function RutaPrivada({ children }) {
  const { autenticado, cargando } = useAutenticacion();
  const ubicacion = useLocation();

  if (cargando) return <CargadorPantallaCompleta texto="Validando tu sesion..." />;

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname + ubicacion.search }} />;
  }

  return children;
}

export default RutaPrivada;
