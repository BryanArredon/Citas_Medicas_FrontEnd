import { Agenda } from './agenda.model';
import { PacienteDetalle } from './pacienteDetalle.model';
import { MedicoDetalle } from './medicoDetalle.model';
import { Servicio } from './servicio.model';
import { Estatus } from './estatus.model';

export interface Cita {
  idCita?: number;
  idPacienteDetalle?: number | null;
  idMedicoDetalle?: number | null;
  idServicio?: number | null;
  idAgenda?: number | null;
  idEstatus?: number | null;
  fechaSolicitud: string;
  motivo?: string | null;
  pacienteDetalle?: PacienteDetalle;
  medicoDetalle?: MedicoDetalle;
  servicio?: Servicio;
  agenda?: Agenda;
  estatus?: Estatus;
}