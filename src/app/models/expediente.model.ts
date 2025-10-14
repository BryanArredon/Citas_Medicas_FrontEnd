import { PacienteDetalle } from './pacienteDetalle.model';
import { HistorialClinico } from './historial.model';

export interface TExpediente {
  idExpediente?: number;
  idPacienteDetalle?: number | null;
  idHistorial?: number | null;
  fechaApertura: string;
  fechaCierre?: string | null;
  fechaActualizacion?: string | null;
  nombreArchivo?: string | null;
  rutaArchivo?: string | null;
  pacienteDetalle?: PacienteDetalle;
  historial?: HistorialClinico;
}