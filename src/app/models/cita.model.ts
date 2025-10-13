import { TAgenda } from './agenda.model';
import { TPacienteDetalle } from './pacienteDetalle.model';
import { TMedicoDetalle } from './medicoDetalle.model';
import { TServicio } from './servicio.model';
import { TEstatus } from './estatus.model';

export interface TCita {
  idCita?: number;
  idPacienteDetalle?: number | null;
  idMedicoDetalle?: number | null;
  idServicio?: number | null;
  idAgenda?: number | null;
  idEstatus?: number | null;
  fechaSolicitud: string;
  motivo?: string | null;
  pacienteDetalle?: TPacienteDetalle;
  medicoDetalle?: TMedicoDetalle;
  servicio?: TServicio;
  agenda?: TAgenda;
  estatus?: TEstatus;
}