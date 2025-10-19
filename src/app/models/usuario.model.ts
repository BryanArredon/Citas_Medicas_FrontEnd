import { Rol } from './rol.model';

export enum Sexo {
  Masculino = 'Masculino',
  Femenino = 'Femenino'
}

export interface Usuario {
  idUsuario?: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  sexo: Sexo;
  fechaNacimiento?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  correoElectronico: string;
  contraseña?: string;
  rolUser?: Rol;  // Relación con RolUser
}