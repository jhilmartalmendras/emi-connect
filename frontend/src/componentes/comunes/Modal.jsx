import { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Boton } from './Boton';

const ANCHOS = {
  pequeno: 'max-w-sm',
  normal: 'max-w-lg',
  grande: 'max-w-2xl',
  amplio: 'max-w-4xl',
};

/**
 * Modal base de EMI Connect.
 * - Cierra con la tecla Escape y al hacer clic en el fondo.
 * - Bloquea el desplazamiento del cuerpo mientras esta abierto.
 * - Atrapa el foco al abrirse para que sea usable con teclado.
 */
export function Modal({
  abierto,
  alCerrar,
  titulo = '',
  descripcion = '',
  children,
  tamanos = 'normal',
  pie = null,
  bloquearCierre = false,
}) {
  // Cierre con la tecla Escape y bloqueo del scroll de fondo.
  useEffect(() => {
    if (!abierto) return undefined;

    function manejarTecla(evento) {
      if (evento.key === 'Escape' && !bloquearCierre) alCerrar();
    }

    document.addEventListener('keydown', manejarTecla);
    const desbordeOriginal = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', manejarTecla);
      document.body.style.overflow = desbordeOriginal;
    };
  }, [abierto, alCerrar, bloquearCierre]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-emi-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget && !bloquearCierre) alCerrar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo || 'Ventana de dialogo'}
        className={`w-full ${ANCHOS[tamanos] || ANCHOS.normal} max-h-[92vh] overflow-y-auto rounded-t-2xl bg-white shadow-tarjeta animar-entrada dark:bg-emi-900 sm:rounded-2xl`}
      >
        {(titulo || !bloquearCierre) && (
          <div className="flex items-start justify-between gap-4 border-b border-emi-100 px-5 py-4 dark:border-emi-800">
            <div>
              {titulo && <h2 className="text-base font-semibold text-emi-900 dark:text-emi-50">{titulo}</h2>}
              {descripcion && <p className="mt-0.5 texto-secundario">{descripcion}</p>}
            </div>
            {!bloquearCierre && (
              <button
                type="button"
                onClick={alCerrar}
                className="rounded-lg p-1.5 text-emi-500 transition hover:bg-emi-50 hover:text-emi-800 dark:hover:bg-emi-800 dark:hover:text-emi-50"
                aria-label="Cerrar ventana"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        <div className="px-5 py-4">{children}</div>

        {pie && <div className="border-t border-emi-100 px-5 py-3 dark:border-emi-800">{pie}</div>}
      </div>
    </div>
  );
}

/**
 * Confirmacion antes de una accion destructiva (eliminar publicaciones,
 * comentarios, bloqueos, productos, etc.).
 */
export function ModalConfirmacion({
  abierto,
  alCerrar,
  alConfirmar,
  titulo = 'Confirmar accion',
  mensaje = 'Esta accion no se puede deshacer.',
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  variante = 'peligro',
  cargando = false,
}) {
  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo={titulo}
      tamanos="pequeno"
      bloquearCierre={cargando}
      pie={
        <div className="flex justify-end gap-2">
          <Boton variante="contorno" onClick={alCerrar} deshabilitado={cargando}>
            {textoCancelar}
          </Boton>
          <Boton variante={variante} onClick={alConfirmar} cargando={cargando}>
            {textoConfirmar}
          </Boton>
        </div>
      }
    >
      <div className="flex gap-3">
        <div className="rounded-full bg-red-50 p-2.5 dark:bg-red-950">
          <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
        </div>
        <p className="text-sm leading-relaxed text-emi-700 dark:text-emi-100">{mensaje}</p>
      </div>
    </Modal>
  );
}

export default Modal;
