import { useState } from 'react';
import { Flag } from 'lucide-react';
import { Modal } from './Modal';
import { Boton } from './Boton';
import { Selector, AreaTexto } from './EntradaTexto';
import { MOTIVOS_REPORTE } from '../../constantes/catalogos';
import { servicioReportes } from '../../servicios/servicioReportes';
import { useToast } from '../../contexto/ContextoToast';

/**
 * Modal para reportar contenido (publicacion, comentario, usuario, producto o comunidad).
 * Cualquier usuario puede reportar; la administracion revisa los reportes.
 */
export function ModalReporte({ abierto, alCerrar, tipo, objetivoId, descripcionObjetivo = '' }) {
  const toast = useToast();
  const [motivo, setMotivo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    if (!motivo) {
      toast.error('Selecciona el motivo del reporte.');
      return;
    }

    setEnviando(true);
    try {
      const resultado = await servicioReportes.crear({ tipo, objetivoId, motivo, descripcion });
      toast.exito(resultado?.mensaje || 'Reporte enviado. Gracias por ayudar a cuidar la comunidad.');
      setMotivo('');
      setDescripcion('');
      alCerrar();
    } catch (error) {
      toast.error(error.mensaje || 'No se pudo enviar el reporte.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Reportar contenido"
      descripcion="Tu reporte sera revisado por la administracion de EMI Connect."
      tamanos="normal"
      bloquearCierre={enviando}
      pie={
        <div className="flex justify-end gap-2">
          <Boton variante="contorno" onClick={alCerrar} deshabilitado={enviando}>
            Cancelar
          </Boton>
          <Boton variante="peligro" icono={Flag} onClick={enviar} cargando={enviando}>
            Enviar reporte
          </Boton>
        </div>
      }
    >
      <div className="space-y-4">
        {descripcionObjetivo && (
          <div className="rounded-lg bg-emi-50 px-3.5 py-2.5 text-sm text-emi-700 dark:bg-emi-800 dark:text-emi-100">
            {descripcionObjetivo}
          </div>
        )}

        <Selector
          etiqueta="Motivo del reporte"
          valor={motivo}
          alCambiar={setMotivo}
          opciones={MOTIVOS_REPORTE}
          requerido
          marcador="Selecciona un motivo"
        />

        <AreaTexto
          etiqueta="Detalles (opcional)"
          valor={descripcion}
          alCambiar={setDescripcion}
          filas={3}
          maxLength={800}
          ayuda="Puedes explicar brevemente lo sucedido para ayudar en la revision."
        />
      </div>
    </Modal>
  );
}

export default ModalReporte;
