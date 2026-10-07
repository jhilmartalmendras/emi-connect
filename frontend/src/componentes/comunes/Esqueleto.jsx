/** Bloque base con animacion de pulso. */
export function Esqueleto({ className = '' }) {
  return (
    <div
      className={`animate-pulsoSuave rounded-md bg-emi-100 dark:bg-emi-800 ${className}`}
      aria-hidden="true"
    />
  );
}

/** Esqueleto de una publicacion del feed. */
export function EsqueletoPublicacion() {
  return (
    <div className="tarjeta p-4">
      <div className="flex items-center gap-3">
        <Esqueleto className="h-11 w-11 rounded-full" />
        <div className="flex-1 space-y-2">
          <Esqueleto className="h-3.5 w-40" />
          <Esqueleto className="h-3 w-24" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Esqueleto className="h-3.5 w-full" />
        <Esqueleto className="h-3.5 w-11/12" />
        <Esqueleto className="h-3.5 w-7/12" />
      </div>
      <Esqueleto className="mt-4 h-40 w-full" />
    </div>
  );
}

/** Esqueleto de una tarjeta generica (comunidades, eventos, productos). */
export function EsqueletoTarjeta() {
  return (
    <div className="tarjeta overflow-hidden">
      <Esqueleto className="h-28 w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Esqueleto className="h-4 w-3/4" />
        <Esqueleto className="h-3 w-full" />
        <Esqueleto className="h-3 w-2/3" />
      </div>
    </div>
  );
}

/** Lista de esqueletos de publicaciones. */
export function EsqueletoLista({ cantidad = 3, tipo = 'publicacion' }) {
  return (
    <div className="space-y-4" aria-busy="true">
      {Array.from({ length: cantidad }).map((_, indice) =>
        tipo === 'publicacion' ? (
          <EsqueletoPublicacion key={indice} />
        ) : (
          <EsqueletoTarjeta key={indice} />
        )
      )}
    </div>
  );
}

export default Esqueleto;
