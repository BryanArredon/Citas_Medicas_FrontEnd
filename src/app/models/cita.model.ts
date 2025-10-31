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
  
  // Campos de pago
  montoPagado?: number;
  idPago?: number;
  estadoPago?: string; // PENDIENTE, APROBADO, RECHAZADO, REEMBOLSADO
  numeroReferenciaPago?: string;
  fechaPago?: string;
  metodoPago?: string;
}

// Interface para la respuesta del pago
export interface PagoResponse {
  success: boolean;
  message: string;
  cita?: Cita;
  pago?: {
    idPago: number;
    monto: number;
    estado: string;
    referencia: string;
    metodoPago: string;
    fechaPago: string;
  };
  error?: string;
}

// Interface para el estado de pago
export interface EstadoPago {
  pagado: boolean;
  idPago?: number;
  monto?: number;
  estado?: string;
  referencia?: string;
  metodoPago?: string;
  fechaPago?: string;
  mensaje?: string;
}