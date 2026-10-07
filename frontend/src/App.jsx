import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LayoutPrincipal } from './componentes/diseno/LayoutPrincipal';
import { CargadorPantallaCompleta } from './componentes/comunes/Cargador';
import { RutaPublica } from './rutas/RutaPublica';
import { RutaPrivada } from './rutas/RutaPrivada';
import { RutaAdministracion } from './rutas/RutaAdministracion';

// Autenticacion (carga inmediata: son las primeras pantallas que se ven).
const Login = lazy(() => import('./paginas/autenticacion/Login'));
const Registro = lazy(() => import('./paginas/autenticacion/Registro'));
const Verificar = lazy(() => import('./paginas/autenticacion/Verificar'));
const Recuperar = lazy(() => import('./paginas/autenticacion/Recuperar'));
const Restablecer = lazy(() => import('./paginas/autenticacion/Restablecer'));

// Paginas principales.
const Inicio = lazy(() => import('./paginas/Inicio'));
const Perfil = lazy(() => import('./paginas/Perfil'));
const Amigos = lazy(() => import('./paginas/Amigos'));
const Comunidades = lazy(() => import('./paginas/Comunidades'));
const DetalleComunidad = lazy(() => import('./paginas/DetalleComunidad'));
const Eventos = lazy(() => import('./paginas/Eventos'));
const DetalleEvento = lazy(() => import('./paginas/DetalleEvento'));
const Mensajes = lazy(() => import('./paginas/Mensajes'));
const Marketplace = lazy(() => import('./paginas/Marketplace'));
const DetalleProducto = lazy(() => import('./paginas/DetalleProducto'));
const Guardados = lazy(() => import('./paginas/Guardados'));
const Notificaciones = lazy(() => import('./paginas/Notificaciones'));
const Configuracion = lazy(() => import('./paginas/Configuracion'));
const Buscar = lazy(() => import('./paginas/Buscar'));
const PaginaPublicacion = lazy(() => import('./paginas/PaginaPublicacion'));
const NoEncontrada = lazy(() => import('./paginas/NoEncontrada'));

// Panel administrativo.
const ResumenAdministracion = lazy(() => import('./paginas/administracion/Resumen'));
const UsuariosAdministracion = lazy(() => import('./paginas/administracion/Usuarios'));
const PublicacionesAdministracion = lazy(() => import('./paginas/administracion/Publicaciones'));
const ComunidadesAdministracion = lazy(() => import('./paginas/administracion/Comunidades'));
const ReportesAdministracion = lazy(() => import('./paginas/administracion/Reportes'));
const EstadisticasAdministracion = lazy(() => import('./paginas/administracion/Estadisticas'));

/** Aplica la estructura general a las rutas autenticadas. */
function EstructuraPrivada({ children }) {
  return <RutaPrivada>{children}</RutaPrivada>;
}

export default function App() {
  return (
    <Suspense fallback={<CargadorPantallaCompleta texto="Cargando EMI Connect..." />}>
      <Routes>
        {/* --------------------------------------------------- Publicas */}
        <Route
          path="/login"
          element={
            <RutaPublica>
              <Login />
            </RutaPublica>
          }
        />
        <Route
          path="/registro"
          element={
            <RutaPublica>
              <Registro />
            </RutaPublica>
          }
        />
        <Route path="/verificar" element={<Verificar />} />
        <Route
          path="/recuperar"
          element={
            <RutaPublica>
              <Recuperar />
            </RutaPublica>
          }
        />
        <Route path="/restablecer" element={<Restablecer />} />

        {/* --------------------------------------------------- Autenticadas */}
        <Route
          element={
            <EstructuraPrivada>
              <LayoutPrincipal />
            </EstructuraPrivada>
          }
        >
          <Route index element={<Navigate to="/inicio" replace />} />
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/perfil/:id" element={<Perfil />} />
          <Route path="/amigos" element={<Amigos />} />
          <Route path="/comunidades" element={<Comunidades />} />
          <Route path="/comunidades/:id" element={<DetalleComunidad />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/eventos/:id" element={<DetalleEvento />} />
          <Route path="/mensajes" element={<Mensajes />} />
          <Route path="/mensajes/:conversacionId" element={<Mensajes />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/:id" element={<DetalleProducto />} />
          <Route path="/guardados" element={<Guardados />} />
          <Route path="/notificaciones" element={<Notificaciones />} />
          <Route path="/configuracion" element={<Configuracion />} />
          <Route path="/buscar" element={<Buscar />} />
          <Route path="/publicacion/:id" element={<PaginaPublicacion />} />

          {/* Panel administrativo (moderadores y administradores) */}
          <Route
            path="/administracion"
            element={
              <RutaAdministracion>
                <ResumenAdministracion />
              </RutaAdministracion>
            }
          />
          <Route
            path="/administracion/usuarios"
            element={
              <RutaAdministracion>
                <UsuariosAdministracion />
              </RutaAdministracion>
            }
          />
          <Route
            path="/administracion/publicaciones"
            element={
              <RutaAdministracion>
                <PublicacionesAdministracion />
              </RutaAdministracion>
            }
          />
          <Route
            path="/administracion/comunidades"
            element={
              <RutaAdministracion>
                <ComunidadesAdministracion />
              </RutaAdministracion>
            }
          />
          <Route
            path="/administracion/reportes"
            element={
              <RutaAdministracion>
                <ReportesAdministracion />
              </RutaAdministracion>
            }
          />
          <Route
            path="/administracion/estadisticas"
            element={
              <RutaAdministracion>
                <EstadisticasAdministracion />
              </RutaAdministracion>
            }
          />

          <Route path="*" element={<NoEncontrada />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
