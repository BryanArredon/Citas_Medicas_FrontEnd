import { Area } from './area.model';

export interface Servicio {
  idServicio?: number;
  nombreServicio: string;
  idArea?: number | null;
  descripcion?: string | null;
  costo?: number | null;
  estatus?: boolean;
  area?: Area;
}