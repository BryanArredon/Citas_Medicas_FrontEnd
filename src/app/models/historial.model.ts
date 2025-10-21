import { PacienteDetalle } from './pacienteDetalle.model';
import { MedicoDetalle } from './medicoDetalle.model';
import { Cita } from './cita.model';

export interface HistorialClinico {
  id?: number;
  paciente?: PacienteDetalle;
  medico?: MedicoDetalle;
  cita?: Cita;
  fecha?: string;
  diagnostico?: string;
  tratamiento?: string;
  medicamentos?: string;
  notasAdicionales?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  // Campos adicionales para compatibilidad
  idHistorial?: number;
  idPacienteDetalle?: number | null;
  idMedicoDetalle?: number | null;
  idCita?: number | null;
  pacienteDetalle?: PacienteDetalle;
  medicoDetalle?: MedicoDetalle;
  // Campos para el formulario
  pacienteId?: number;
  medicoId?: number;
  citaId?: number;
}