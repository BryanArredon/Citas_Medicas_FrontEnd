import { Servicio } from './servicio.model';
import { Usuario } from './usuario.model';

export interface MedicoDetalle {
  idMedicoDetalle?: number;
  idUsuario?: number;
  idServicio?: number | null;
  cedulaProfesional?: string | null;
  usuario?: Usuario;
  servicio?: Servicio;
}