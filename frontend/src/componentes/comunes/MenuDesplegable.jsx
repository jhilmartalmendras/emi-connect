import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useClickExterno } from '../../hooks/useClickExterno';

/**
 * Menu de opciones contextuales (tres puntos).
 * Se cierra al hacer clic fuera o con la tecla Escape.
 */
export function MenuDesplegable({ opciones = [], etiquetaBoton = 'Mas opciones', alineacion = 'derecha' }) {
  const [abierto, setAbierto] = useState(false);
  const referencia = useClickExterno(abierto, () => setAbierto(false));

  if (opciones.length === 0) return null;

  return (
    <div className="relative" ref={referencia}>
      <button
        type="button"
        onClick={() => setAbierto((actual) => !actual)}
        className="rounded-lg p-2 text-emi-500 transition hover:bg-emi-100 hover:text-emi-800 dark:hover:bg-emi-800 dark:hover:text-emi-50"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={etiquetaBoton}
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
      </button>

      {abierto && (
        <div
          role="menu"
          className={`absolute z-30 mt-1 min-w-[190px] overflow-hidden rounded-xl border border-emi-100 bg-white py-1 shadow-tarjeta animar-entrada dark:border-emi-700 dark:bg-emi-900 ${
            alineacion === 'izquierda' ? 'left-0' : 'right-0'
          }`}
        >
          {opciones.map((opcion) => {
            const Icono = opcion.icono;
            return (
              <button
                key={opcion.etiqueta}
                type="button"
                role="menuitem"
                onClick={() => {
                  setAbierto(false);
                  opcion.alSeleccionar();
                }}
                className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm transition hover:bg-emi-50 dark:hover:bg-emi-800 ${
                  opcion.peligro ? 'text-red-600 dark:text-red-400' : 'text-emi-700 dark:text-emi-100'
                }`}
              >
                {Icono && <Icono className="h-4 w-4 shrink-0" aria-hidden="true" />}
                {opcion.etiqueta}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MenuDesplegable;
