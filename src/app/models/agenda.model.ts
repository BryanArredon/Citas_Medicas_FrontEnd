import { MedicoDetalle } from './medicoDetalle.model';

export interface Agenda {
  idAgenda?: number;
  fecha: string;
  horaInicio: string;      // TIME -> 'HH:mm:ss' o 'HH:mm'
  horaFin: string;         // TIME -> 'HH:mm:ss' o 'HH:mm'
  idMedicoDetalle?: number | null;
  medicoDetalle?: MedicoDetalle;
}