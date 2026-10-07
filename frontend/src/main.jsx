import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './estilos/index.css';
import { ProveedorTema } from './contexto/ContextoTema';
import { ProveedorToast } from './contexto/ContextoToast';
import { ProveedorAutenticacion } from './contexto/ContextoAutenticacion';
import { ProveedorSocket } from './contexto/ContextoSocket';
import { ProveedorContadores, useContadores } from './contexto/ContextoContadores';

/**
 * Conexion en tiempo real: al llegar una notificacion o un mensaje se
 * incrementa el contador correspondiente de la barra superior.
 */
function AplicacionConectada() {
  const { incrementarContador } = useContadores();

  const alRecibirNotificacion = React.useCallback(
    () => incrementarContador('notificaciones'),
    [incrementarContador]
  );

  const alRecibirMensaje = React.useCallback(() => incrementarContador('mensajes'), [incrementarContador]);

  return (
    <ProveedorSocket alRecibirNotificacion={alRecibirNotificacion} alRecibirMensaje={alRecibirMensaje}>
      <App />
    </ProveedorSocket>
  );
}

/**
 * Orden de los proveedores:
 * tema -> mensajes -> sesion -> contadores -> tiempo real -> rutas.
 */
function EMIConnect() {
  return (
    <ProveedorTema>
      <ProveedorToast>
        <ProveedorAutenticacion>
          <ProveedorContadores>
            <BrowserRouter>
              <AplicacionConectada />
            </BrowserRouter>
          </ProveedorContadores>
        </ProveedorAutenticacion>
      </ProveedorToast>
    </ProveedorTema>
  );
}

ReactDOM.createRoot(document.getElementById('raiz')).render(
  <React.StrictMode>
    <EMIConnect />
  </React.StrictMode>
);
