import { useState } from 'react';
import { TIPOS_REACCION, obtenerReaccion } from '../../constantes/catalogos';
import { useClickExterno } from '../../hooks/useClickExterno';

/**
 * Boton de reaccion estilo red social.
 * Muestra la reaccion actual del usuario y, al mantener pulsado o hacer clic,
 * abre el menu con las seis reacciones disponibles.
 */
export function SelectorReaccion({ reaccionActual = null, alReaccionar, deshabilitado = false, compacto = false }) {
  const [abierto, setAbierto] = useState(false);
  const referencia = useClickExterno(abierto, () => setAbierto(false));
  const actual = obtenerReaccion(reaccionActual);

  const alternar = (tipo) => {
    setAbierto(false);
    alReaccionar(tipo);
  };

  return (
    <div className="relative" ref={referencia}>
      <button
        type="button"
        disabled={deshabilitado}
        onClick={() => setAbierto((valor) => !valor)}
        onMouseEnter={() => setAbierto(true)}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition
          focus:outline-none focus:ring-2 focus:ring-emi-200 disabled:cursor-not-allowed disabled:opacity-60
          ${
            actual
              ? 'bg-emi-50 text-emi-700 hover:bg-emi-100 dark:bg-emi-800 dark:text-emi-100 dark:hover:bg-emi-700'
              : 'text-emi-500 hover:bg-emi-50 dark:text-emi-300 dark:hover:bg-emi-800'
          }`}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={actual ? `Reaccion: ${actual.etiqueta}. Cambiar reaccion` : 'Reaccionar'}
      >
        <span aria-hidden="true" className="text-base leading-none">
          {actual ? actual.emoji : '👍'}
        </span>
        {!compacto && <span>{actual ? actual.etiqueta : 'Me gusta'}</span>}
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-30 mb-2 flex gap-1 rounded-full border border-emi-100 bg-white p-1.5 shadow-tarjeta animar-entrada dark:border-emi-700 dark:bg-emi-900"
        >
          {TIPOS_REACCION.map((reaccion) => (
            <button
              key={reaccion.valor}
              type="button"
              onClick={() => alternar(reaccion.valor)}
              title={reaccion.etiqueta}
              aria-label={reaccion.etiqueta}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-lg transition hover:scale-125 hover:bg-emi-50 dark:hover:bg-emi-800 ${
                reaccionActual === reaccion.valor ? 'bg-emi-50 dark:bg-emi-800 ring-2 ring-emi-400' : ''
              }`}
            >
              <span aria-hidden="true">{reaccion.emoji}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SelectorReaccion;
