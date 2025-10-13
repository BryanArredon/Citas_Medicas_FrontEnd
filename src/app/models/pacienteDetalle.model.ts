import { TUsuario } from './usuario.model';

export interface TPacienteDetalle {
  idPacienteDetalle?: number;
  idUsuario: number;
  tipoSangre?: string | null;
  alergias?: string | null;
  usuario?: TUsuario;
}