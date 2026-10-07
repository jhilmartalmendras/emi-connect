import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ContextoTema = createContext(null);

const CLAVE_TEMA = 'emi_connect_tema';
const TEMAS_VALIDOS = ['claro', 'oscuro', 'sistema'];

/** Aplica o quita la clase "dark" del documento segun el tema elegido. */
function aplicarTema(tema) {
  const raiz = document.documentElement;
  const prefiereOscuro =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;

  const usarOscuro = tema === 'oscuro' || (tema === 'sistema' && prefiereOscuro);

  if (usarOscuro) {
    raiz.classList.add('dark');
  } else {
    raiz.classList.remove('dark');
  }

  // El color de la barra del navegador acompana al tema (cuando esta soportado).
  let metaTema = document.querySelector('meta[name="theme-color"]');
  if (!metaTema) {
    metaTema = document.createElement('meta');
    metaTema.setAttribute('name', 'theme-color');
    document.head.appendChild(metaTema);
  }
  metaTema.setAttribute('content', usarOscuro ? '#071426' : '#0b2039');
}

export function ProveedorTema({ children }) {
  const [tema, setTema] = useState(() => {
    const guardado = localStorage.getItem(CLAVE_TEMA);
    return TEMAS_VALIDOS.includes(guardado) ? guardado : 'sistema';
  });

  // Aplica el tema cada vez que cambia.
  useEffect(() => {
    aplicarTema(tema);
    localStorage.setItem(CLAVE_TEMA, tema);
  }, [tema]);

  // Escucha los cambios del tema del sistema cuando el modo es "sistema".
  useEffect(() => {
    if (tema !== 'sistema' || !window.matchMedia) return undefined;

    const consulta = window.matchMedia('(prefers-color-scheme: dark)');
    const manejarCambio = () => aplicarTema('sistema');

    // addEventListener no existe en navegadores antiguos (se usa addListener como respaldo).
    if (consulta.addEventListener) {
      consulta.addEventListener('change', manejarCambio);
      return () => consulta.removeEventListener('change', manejarCambio);
    }
    consulta.addListener(manejarCambio);
    return () => consulta.removeListener(manejarCambio);
  }, [tema]);

  const cambiarTema = useCallback((nuevoTema) => {
    if (!TEMAS_VALIDOS.includes(nuevoTema)) return;
    setTema(nuevoTema);
  }, []);

  /** Alterna entre claro y oscuro tomando como base el tema actual. */
  const alternarTema = useCallback(() => {
    const raiz = document.documentElement;
    const estaOscuro = raiz.classList.contains('dark');
    setTema(estaOscuro ? 'claro' : 'oscuro');
  }, []);

  const valor = useMemo(
    () => ({ tema, cambiarTema, alternarTema, esOscuro: document.documentElement.classList.contains('dark') }),
    [tema, cambiarTema, alternarTema]
  );

  return <ContextoTema.Provider value={valor}>{children}</ContextoTema.Provider>;
}

/** Hook de acceso al tema. */
export function useTema() {
  const contexto = useContext(ContextoTema);
  if (!contexto) {
    throw new Error('useTema debe usarse dentro de ProveedorTema');
  }
  return contexto;
}
