import { NavLink } from 'react-router-dom';
import { ELEMENTOS_MOVIL } from '../../constantes/navegacion';
import { useContadores } from '../../contexto/ContextoContadores';

/**
 * Navegacion inferior para movil con los accesos principales
 * y sus contadores en tiempo real.
 */
export function MenuMovil() {
  const { contadores } = useContadores();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-emi-100 bg-white/95 backdrop-blur lg:hidden dark:border-emi-800 dark:bg-emi-900/95"
      aria-label="Navegacion movil"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {ELEMENTOS_MOVIL.map((elemento) => {
          const Icono = elemento.icono;
          const contador = elemento.contador ? contadores[elemento.contador] || 0 : 0;

          return (
            <li key={elemento.ruta} className="flex-1">
              <NavLink
                to={elemento.ruta}
                className={({ isActive }) =>
                  `relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition ${
                    isActive ? 'text-emi-700 dark:text-dorado-400' : 'text-emi-400 dark:text-emi-300'
                  }`
                }
              >
                <span className="relative">
                  <Icono className="h-5 w-5" aria-hidden="true" />
                  {contador > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-dorado-500 px-1 text-[9px] font-bold text-emi-950">
                      {contador > 99 ? '99+' : contador}
                    </span>
                  )}
                </span>
                {elemento.etiqueta}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default MenuMovil;
