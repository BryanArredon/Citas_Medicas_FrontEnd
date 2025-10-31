import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Area } from '../models/area.model';

@Injectable({
  providedIn: 'root'
})
export class AreaService {

  private apiUrl = 'http://localhost:8080/api/areas'; // URL del backend
  constructor(private http: HttpClient) {}

  getAreas(): Observable<Area[]> {
    // Cambiar a /api/areas para obtener todas las áreas (no solo activas)
    // Si quieres solo activas, necesitas actualizar el estatus en la BD
    return this.http.get<Area[]>(`${this.apiUrl}`);
  }

  getAreaById(id: number): Observable<Area> {
    return this.http.get<Area>(`${this.apiUrl}/${id}`);
  }

  createArea(area: Area): Observable<Area> {
    return this.http.post<Area>(this.apiUrl, area);
  }

  updateArea(id: number, area: Area): Observable<Area> {
    return this.http.put<Area>(`${this.apiUrl}/${id}`, area);
  }

  deleteArea(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  reactivateArea(id: number): Observable<Area> {
    return this.http.put<Area>(`${this.apiUrl}/${id}/reactivar`, {});
  }
}
