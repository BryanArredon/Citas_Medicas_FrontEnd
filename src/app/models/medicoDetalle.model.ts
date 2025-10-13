import { TServicio } from './servicio.model';
import { TUsuario } from './usuario.model';

export interface TMedicoDetalle {
  idMedicoDetalle?: number;
  idUsuario: number;
  idServicio?: number | null;
  cedulaProfesional?: string | null;
  usuario?: TUsuario;
  servicio?: TServicio;
}