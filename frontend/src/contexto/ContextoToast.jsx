import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ContextoToast = createContext(null);

const ESTILOS = {
  exito: {
    contenedor: 'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100',
    icono: CheckCircle2,
  },
  error: {
    contenedor: 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
    icono: AlertCircle,
  },
  informativo: {
    contenedor: 'border-emi-200 bg-white text-emi-900 dark:border-emi-700 dark:bg-emi-900 dark:text-emi-50',
    icono: Info,
  },
};

export function ProveedorToast({ children }) {
  const [toasts, setToasts] = useState([]);
  const contador = useRef(0);

  const cerrar = useCallback((id) => {
    setToasts((actuales) => actuales.filter((toast) => toast.id !== id));
  }, []);

  /**
   * Muestra un mensaje temporal.
   * @param {string} mensaje texto visible
   * @param {'exito'|'error'|'informativo'} tipo estilo del mensaje
   */
  const mostrar = useCallback(
    (mensaje, tipo = 'informativo', duracion = 4000) => {
      contador.current += 1;
      const id = contador.current;

      setToasts((actuales) => [...actuales.slice(-3), { id, mensaje, tipo }]);
      window.setTimeout(() => cerrar(id), duracion);
      return id;
    },
    [cerrar]
  );

  const exito = useCallback((mensaje) => mostrar(mensaje, 'exito'), [mostrar]);
  const error = useCallback((mensaje) => mostrar(mensaje, 'error', 6000), [mostrar]);
  const informativo = useCallback((mensaje) => mostrar(mensaje, 'informativo'), [mostrar]);

  const valor = useMemo(() => ({ mostrar, exito, error, informativo }), [mostrar, exito, error, informativo]);

  return (
    <ContextoToast.Provider value={valor}>
      {children}

      {/* Contenedor de mensajes: fijo arriba a la derecha en escritorio, abajo en movil */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-auto sm:right-4 sm:left-auto sm:top-20 sm:items-end"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const estilo = ESTILOS[toast.tipo] || ESTILOS.informativo;
          const Icono = estilo.icono;
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-tarjeta animar-entrada ${estilo.contenedor}`}
            >
              <Icono className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <p className="flex-1 text-sm leading-snug">{toast.mensaje}</p>
              <button
                type="button"
                onClick={() => cerrar(toast.id)}
                className="rounded-md p-1 transition hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Cerrar mensaje"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ContextoToast.Provider>
  );
}

/** Hook de acceso a los mensajes temporales. */
export function useToast() {
  const contexto = useContext(ContextoToast);
  if (!contexto) {
    throw new Error('useToast debe usarse dentro de ProveedorToast');
  }
  return contexto;
}
