import { TMedicoDetalle } from './medicoDetalle.model';

export interface TAgenda {
  idAgenda?: number;
  fecha: string;
  horaInicio: string;      // TIME -> 'HH:mm:ss' o 'HH:mm'
  horaFin: string;         // TIME -> 'HH:mm:ss' o 'HH:mm'
  idMedicoDetalle?: number | null;
  medicoDetalle?: TMedicoDetalle;
}