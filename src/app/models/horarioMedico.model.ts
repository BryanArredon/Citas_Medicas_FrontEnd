export enum EstadoMedico {
  DISPONIBLE = 'DISPONIBLE',
  NO_DISPONIBLE = 'NO_DISPONIBLE',
  RESERVADO = 'RESERVADO'
}

export interface MedicoRef {
  id?: number; // corresponde a Medico.id en el backend
  usuario?: {
    idUsuario?: number;
    nombre?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
  };
}

export interface HorarioMedico {
  id?: number;
  medico?: MedicoRef;
  fecha?: string; // yyyy-MM-dd
  horarioInicio?: string; // HH:mm[:ss]
  horarioFin?: string;    // HH:mm[:ss]
  duracion?: number;
  estadoMedico?: EstadoMedico;
  validUntil?: string; // yyyy-MM-dd
}
