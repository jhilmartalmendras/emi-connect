import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BarraLateral } from './BarraLateral';
import { BarraSuperior } from './BarraSuperior';
import { MenuMovil } from './MenuMovil';
import { PanelDerecho } from './PanelDerecho';

/**
 * Estructura general de las paginas autenticadas:
 * barra lateral (escritorio), barra superior, contenido central,
 * panel derecho (solo en el inicio) y menu inferior (movil).
 */
export function LayoutPrincipal() {
  const ubicacion = useLocation();
  const mostrarPanel = ubicacion.pathname === '/inicio';

  // Al cambiar de pagina se vuelve al principio del contenido.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [ubicacion.pathname]);

  return (
    <div className="min-h-screen">
      <BarraLateral />
      <BarraSuperior />

      <main className="pt-16 pb-20 lg:pb-8 lg:pl-64">
        <div className={`mx-auto flex max-w-6xl gap-6 px-4 py-6 ${mostrarPanel ? '' : 'max-w-5xl'}`}>
          <div className="min-w-0 flex-1 animar-entrada">
            <Outlet />
          </div>

          {mostrarPanel && (
            <aside className="hidden w-80 shrink-0 xl:block" aria-label="Sugerencias">
              <div className="sticky top-20">
                <PanelDerecho />
              </div>
            </aside>
          )}
        </div>
      </main>

      <MenuMovil />
    </div>
  );
}

export default LayoutPrincipal;
