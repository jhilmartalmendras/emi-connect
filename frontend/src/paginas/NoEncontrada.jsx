import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Boton } from '../componentes/comunes/Boton';
import { EstadoVacio } from '../componentes/comunes/EstadoVacio';

/** Pagina 404 mostrada dentro de la aplicacion autenticada. */
export default function NoEncontrada() {
  const navegar = useNavigate();

  return (
    <div className="mx-auto max-w-xl">
      <EstadoVacio
        titulo="Pagina no encontrada"
        descripcion="La ruta que solicitaste no existe en EMI Connect. Puede que el enlace este desactualizado."
        icono={Compass}
      />
      <div className="mt-4 flex justify-center">
        <Boton variante="primario" onClick={() => navegar('/inicio')}>
          Volver al inicio
        </Boton>
      </div>
    </div>
  );
}
