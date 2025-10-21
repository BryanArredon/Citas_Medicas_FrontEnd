import { MedicoDetalle } from './medicoDetalle.model';

export interface Agenda {
  id?: number;
  fecha: string; // LocalDateTime -> ISO string
  horaInicio: string; // LocalTime -> 'HH:mm:ss'
  horaFin: string; // LocalTime -> 'HH:mm:ss'
  medico?: MedicoDetalle; // Relación con médico
  // Campos adicionales para compatibilidad
  idAgenda?: number;
  idMedicoDetalle?: number | null;
  medicoDetalle?: MedicoDetalle;
}