import { MedicoDetalle } from './medicoDetalle.model';

export interface Agenda {
  id?: number;              // El backend devuelve 'id', no 'idAgenda'
  idAgenda?: number;        // Mantener para compatibilidad
  fecha: string;
  horaInicio: string;      // TIME -> 'HH:mm:ss' o 'HH:mm'
  horaFin: string;         // TIME -> 'HH:mm:ss' o 'HH:mm'
  idMedicoDetalle?: number | null;
  medico?: any;            // El backend devuelve el objeto completo del médico
  medicoDetalle?: MedicoDetalle;
}