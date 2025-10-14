import { Rol } from './rol.model';

export interface Usuario {
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
  rol?: Rol;
  estatus?: boolean;
}