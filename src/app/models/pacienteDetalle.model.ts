import { Usuario } from './usuario.model';

export interface PacienteDetalle {
  id?: number;
  idUsuario: number;
  tipoSangre?: string | null;
  alergias?: string | null;
  usuario?: Usuario;
}