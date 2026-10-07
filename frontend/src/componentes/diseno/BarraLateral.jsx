import { Link, NavLink } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { IDENTIDAD } from '../../constantes/identidad';
import { ELEMENTOS_NAVEGACION, ELEMENTOS_ADMINISTRACION } from '../../constantes/navegacion';
import { useContadores } from '../../contexto/ContextoContadores';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';

/**
 * Barra lateral de navegacion (escritorio).
 * Incluye el menu principal, el panel administrativo (cuando aplica)
 * y los contadores de mensajes, notificaciones y solicitudes.
 */
export function BarraLateral() {
  const { contadores } = useContadores();
  const { esAdministracion } = useAutenticacion();

  const renderElemento = (elemento) => {
    const Icono = elemento.icono;
    const contador = elemento.contador ? contadores[elemento.contador] || 0 : 0;

    return (
      <NavLink
        key={elemento.ruta}
        to={elemento.ruta}
        className={({ isActive }) =>
          `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
            isActive
              ? 'bg-emi-700 text-white shadow-suave'
              : 'text-emi-600 hover:bg-emi-100 dark:text-emi-200 dark:hover:bg-emi-800'
          }`
        }
      >
        <Icono className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span className="flex-1">{elemento.etiqueta}</span>
        {contador > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-dorado-500 px-1 text-[10px] font-bold text-emi-950">
            {contador > 99 ? '99+' : contador}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-emi-100 bg-white dark:border-emi-800 dark:bg-emi-900 lg:flex">
      {/* Marca */}
      <Link to="/inicio" className="flex items-center gap-3 px-5 py-5" aria-label="Ir al inicio">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emi-900 text-sm font-bold text-white dark:bg-emi-700">
          {IDENTIDAD.siglas}
        </span>
        <span>
          <span className="block text-base font-bold leading-tight text-emi-900 dark:text-emi-50">
            {IDENTIDAD.nombrePlataforma}
          </span>
          <span className="block text-[11px] leading-tight text-emi-400">{IDENTIDAD.lema}</span>
        </span>
      </Link>

      {/* Navegacion principal */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label="Navegacion principal">
        {ELEMENTOS_NAVEGACION.map(renderElemento)}

        {esAdministracion && (
          <>
            <div className="separador my-3" role="presentation" />
            <p className="flex items-center gap-2 px-3.5 pb-1 text-xs font-semibold uppercase tracking-wide text-emi-400">
              <Shield className="h-3.5 w-3.5" aria-hidden="true" />
              Administracion
            </p>
            {ELEMENTOS_ADMINISTRACION.map(renderElemento)}
          </>
        )}
      </nav>

      {/* Pie */}
      <div className="border-t border-emi-100 px-5 py-4 dark:border-emi-800">
        <p className="text-[11px] leading-relaxed text-emi-400">
          {IDENTIDAD.nombreInstitucion} · {IDENTIDAD.anio}
        </p>
        <p className="text-[11px] text-emi-400">{IDENTIDAD.descripcion}</p>
      </div>
    </aside>
  );
}

export default BarraLateral;
