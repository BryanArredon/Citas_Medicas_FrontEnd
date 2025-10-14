import { Usuario } from './usuario.model';

export interface PacienteDetalle {
  idPacienteDetalle?: number;
  idUsuario: number;
  tipoSangre?: string | null;
  alergias?: string | null;
  usuario?: Usuario;
}