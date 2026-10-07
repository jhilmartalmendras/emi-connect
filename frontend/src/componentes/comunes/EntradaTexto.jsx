import { useId } from 'react';

/**
 * Campo de formulario con etiqueta, texto de ayuda y mensaje de error.
 * Se usa un <label> real asociado al campo mediante id para accesibilidad.
 */
export function Campo({
  etiqueta,
  tipo = 'text',
  valor,
  alCambiar,
  error = '',
  ayuda = '',
  requerido = false,
  marcador = '',
  icono: Icono = null,
  deshabilitado = false,
  min,
  max,
  maxLength,
  nombre,
  className = '',
}) {
  const id = useId();
  const idError = `${id}-error`;
  const idAyuda = `${id}-ayuda`;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {etiqueta && (
        <label htmlFor={id} className="text-sm font-medium text-emi-800 dark:text-emi-100">
          {etiqueta}
          {requerido && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        {Icono && (
          <Icono
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emi-400"
            aria-hidden="true"
          />
        )}
        <input
          id={id}
          name={nombre}
          type={tipo}
          value={valor === undefined || valor === null ? '' : valor}
          onChange={(evento) => alCambiar(evento.target.value)}
          placeholder={marcador}
          disabled={deshabilitado}
          required={requerido}
          min={min}
          max={max}
          maxLength={maxLength}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? idError : ayuda ? idAyuda : undefined}
          className={`campo-entrada ${Icono ? 'pl-9' : ''} ${
            error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''
          }`}
        />
      </div>

      {error && (
        <p id={idError} className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {!error && ayuda && (
        <p id={idAyuda} className="text-xs text-emi-500 dark:text-emi-300">
          {ayuda}
        </p>
      )}
    </div>
  );
}

/** Area de texto multilinea con contador opcional. */
export function AreaTexto({
  etiqueta,
  valor,
  alCambiar,
  error = '',
  ayuda = '',
  filas = 4,
  marcador = '',
  maxLength,
  requerido = false,
  className = '',
  deshabilitado = false,
}) {
  const id = useId();
  const longitud = String(valor || '').length;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {etiqueta && (
        <label htmlFor={id} className="text-sm font-medium text-emi-800 dark:text-emi-100">
          {etiqueta}
          {requerido && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <textarea
        id={id}
        rows={filas}
        value={valor || ''}
        onChange={(evento) => alCambiar(evento.target.value)}
        placeholder={marcador}
        maxLength={maxLength}
        disabled={deshabilitado}
        aria-invalid={Boolean(error)}
        className={`campo-entrada resize-y ${error ? 'border-red-400 focus:border-red-500' : ''}`}
      />
      <div className="flex items-center justify-between gap-2">
        {error ? (
          <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
        ) : (
          <p className="text-xs text-emi-500 dark:text-emi-300">{ayuda}</p>
        )}
        {maxLength && (
          <span className="text-xs text-emi-400">
            {longitud}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

/** Lista desplegable con etiqueta. */
export function Selector({
  etiqueta,
  valor,
  alCambiar,
  opciones = [],
  error = '',
  ayuda = '',
  requerido = false,
  className = '',
  deshabilitado = false,
  marcador = 'Selecciona una opcion',
}) {
  const id = useId();

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {etiqueta && (
        <label htmlFor={id} className="text-sm font-medium text-emi-800 dark:text-emi-100">
          {etiqueta}
          {requerido && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <select
        id={id}
        value={valor || ''}
        onChange={(evento) => alCambiar(evento.target.value)}
        disabled={deshabilitado}
        aria-invalid={Boolean(error)}
        className={`campo-entrada ${error ? 'border-red-400' : ''}`}
      >
        <option value="">{marcador}</option>
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
      {error && <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
      {!error && ayuda && <p className="text-xs text-emi-500 dark:text-emi-300">{ayuda}</p>}
    </div>
  );
}

/** Casilla de verificacion con etiqueta. */
export function Casilla({ etiqueta, valor, alCambiar, ayuda = '', deshabilitado = false }) {
  const id = useId();

  return (
    <div className="flex items-start gap-2.5">
      <input
        id={id}
        type="checkbox"
        checked={Boolean(valor)}
        onChange={(evento) => alCambiar(evento.target.checked)}
        disabled={deshabilitado}
        className="mt-0.5 h-4 w-4 rounded border-emi-300 text-emi-600 focus:ring-emi-300 dark:border-emi-600 dark:bg-emi-900"
      />
      <div>
        <label htmlFor={id} className="text-sm text-emi-800 dark:text-emi-100">
          {etiqueta}
        </label>
        {ayuda && <p className="text-xs text-emi-500 dark:text-emi-300">{ayuda}</p>}
      </div>
    </div>
  );
}
