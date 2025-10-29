import { Servicio } from './servicio.model';
import { Usuario } from './usuario.model';

export interface MedicoDetalle {
  id?: number;
  idUsuario?: number;
  idServicio?: number | null;
  cedulaProfecional?: string | null;
  usuario?: Usuario;
  servicio?: Servicio;
}