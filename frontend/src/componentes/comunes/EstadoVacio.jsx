import { Inbox, AlertTriangle, RefreshCw } from 'lucide-react';
import { Boton } from './Boton';

/** Mensaje cuando no hay contenido que mostrar. */
export function EstadoVacio({
  titulo = 'No hay contenido todavia',
  descripcion = '',
  icono: Icono = Inbox,
  accion = null,
  etiquetaAccion = '',
}) {
  return (
    <div className="tarjeta flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="rounded-full bg-emi-50 p-4 dark:bg-emi-800">
        <Icono className="h-7 w-7 text-emi-400" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-emi-900 dark:text-emi-50">{titulo}</h3>
      {descripcion && <p className="max-w-sm texto-secundario">{descripcion}</p>}
      {accion && (
        <Boton variante="secundario" tamano="pequeno" onClick={accion}>
          {etiquetaAccion || 'Realizar accion'}
        </Boton>
      )}
    </div>
  );
}

/** Mensaje cuando una peticion falla, con opcion de reintentar. */
export function EstadoError({
  mensaje = 'No pudimos cargar esta informacion.',
  detalle = 'Intenta nuevamente en unos segundos.',
  alReintentar = null,
}) {
  return (
    <div className="tarjeta flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <div className="rounded-full bg-red-50 p-4 dark:bg-red-950">
        <AlertTriangle className="h-7 w-7 text-red-500" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-emi-900 dark:text-emi-50">{mensaje}</h3>
      <p className="texto-secundario">{detalle}</p>
      {alReintentar && (
        <Boton variante="contorno" tamano="pequeno" icono={RefreshCw} onClick={alReintentar}>
          Reintentar
        </Boton>
      )}
    </div>
  );
}

export default EstadoVacio;
