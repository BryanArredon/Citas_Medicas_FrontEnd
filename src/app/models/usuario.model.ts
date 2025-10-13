import { TRol } from './rol.model';

export interface TUsuario {
  idUsuario?: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  sexo: 'M' | 'F';
  fechaNacimiento?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  correoElectronico: string;
  contraseña?: string;
  idRol: number;
  rol?: TRol;
  estatus?: boolean;
}