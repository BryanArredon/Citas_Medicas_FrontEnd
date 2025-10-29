import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Servicio } from '../models/servicio.model';

@Injectable({
  providedIn: 'root'
})
export class ServicioService {
  private apiUrl = 'http://localhost:8080/api/servicios'; // URL del backend

  constructor(private http: HttpClient) { }

  // Obtener todos los servicios
  getAllServicios(): Observable<Servicio[]> {
    return this.http.get<Servicio[]>(this.apiUrl);
  }

  // Obtener servicio por ID
  getServicioById(id: number): Observable<Servicio> {
    return this.http.get<Servicio>(`${this.apiUrl}/${id}`);
  }

  // Obtener servicios por área
  getServiciosByArea(areaId: number): Observable<Servicio[]> {
    return this.http.get<Servicio[]>(`${this.apiUrl}/area/${areaId}`);
  }

  createServicio(servicio: any): Observable<Servicio> {
    console.log('🆕 Service: Creando nuevo servicio', servicio);
    
    // Asegurar que el objeto tenga la estructura correcta para el backend
    const servicioData = {
      nombreServicio: servicio.nombreServicio,
      descripcionServicio: servicio.descripcionServicio,
      costo: servicio.costo,
      duracion: servicio.duracion,
      area: {
        id: servicio.idArea
      }
    };
    return this.http.post<Servicio>(this.apiUrl, servicioData);
  }

  // Actualizar servicio
  updateServicio(id: number, servicio: any): Observable<Servicio> {
    console.log(`✏️ Service: Actualizando servicio ${id}`, servicio);
    
    const servicioData = {
      nombreServicio: servicio.nombreServicio,
      descripcionServicio: servicio.descripcionServicio,
      costo: servicio.costo,
      duracion: servicio.duracion,
      area: {
        id: servicio.idArea
      }
    };
    
    return this.http.put<Servicio>(`${this.apiUrl}/${id}`, servicioData);
  }

  // Eliminar servicio
  deleteServicio(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}