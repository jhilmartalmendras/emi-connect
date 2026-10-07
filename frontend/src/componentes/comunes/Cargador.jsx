/**
 * Indicador de carga circular.
 * Usa animacion CSS propia (compatible con navegadores antiguos).
 */
export function Cargador({ tamanos = 'h-5 w-5', texto = '', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} role="status">
      <span
        className={`${tamanos} animate-spin rounded-full border-2 border-current border-t-transparent`}
        aria-hidden="true"
      />
      {texto && <span className="text-sm">{texto}</span>}
      <span className="solo-lectores">Cargando</span>
    </span>
  );
}

/** Pantalla completa de carga (se usa al validar la sesion). */
export function CargadorPantallaCompleta({ texto = 'Cargando EMI Connect...' }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-emi-50 dark:bg-emi-950">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emi-900 text-xl font-bold text-white">
        EMI
      </div>
      <Cargador tamanos="h-6 w-6 text-emi-600 dark:text-emi-200" texto={texto} />
    </div>
  );
}

export default Cargador;
