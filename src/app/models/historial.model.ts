import { PacienteDetalle } from './pacienteDetalle.model';
import { MedicoDetalle } from './medicoDetalle.model';
import { Cita } from './cita.model';

export interface HistorialClinico {
  idHistorial?: number;
  idPacienteDetalle?: number | null;
  idMedicoDetalle?: number | null;
  idCita?: number | null;
  fecha: string;
  diagnostico?: string | null;
  tratamiento?: string | null;
  notasAdicionales?: string | null;
  fechaActualizacion?: string | null;
  pacienteDetalle?: PacienteDetalle;
  medicoDetalle?: MedicoDetalle;
  cita?: Cita;
}