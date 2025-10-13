import { TPacienteDetalle } from './pacienteDetalle.model';
import { TMedicoDetalle } from './medicoDetalle.model';
import { TCita } from './cita.model';

export interface THistorialClinico {
  idHistorial?: number;
  idPacienteDetalle?: number | null;
  idMedicoDetalle?: number | null;
  idCita?: number | null;
  fecha: string;
  diagnostico?: string | null;
  tratamiento?: string | null;
  notasAdicionales?: string | null;
  fechaActualizacion?: string | null;
  pacienteDetalle?: TPacienteDetalle;
  medicoDetalle?: TMedicoDetalle;
  cita?: TCita;
}