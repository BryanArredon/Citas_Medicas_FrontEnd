import { Area } from './area.model';

export interface Servicio {
  id?: number;
  nombreServicio: string;
  descripcionServicio?: string | null;
  costo?: number | null;
  duracion?: number;
  area?: Area;
  idArea?: number | null;
}