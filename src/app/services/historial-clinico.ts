import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HistorialClinico } from '../models/historial.model';

@Injectable({
  providedIn: 'root'
})
export class HistorialClinicoService {
  private apiUrl = 'http://localhost:8080/api/historial-clinico';

  constructor(private http: HttpClient) { }

  // Obtener todos los historiales clínicos
  getAllHistorialClinico(): Observable<HistorialClinico[]> {
    return this.http.get<HistorialClinico[]>(this.apiUrl);
  }

  // Obtener historial clínico por ID
  getHistorialClinicoById(id: number): Observable<HistorialClinico> {
    return this.http.get<HistorialClinico>(`${this.apiUrl}/${id}`);
  }

  // Obtener historiales clínicos por paciente
  getHistorialClinicoByPaciente(pacienteId: number): Observable<HistorialClinico[]> {
    return this.http.get<HistorialClinico[]>(`${this.apiUrl}/paciente/${pacienteId}`);
  }

  // Obtener historiales clínicos por médico
  getHistorialClinicoByMedico(medicoId: number): Observable<HistorialClinico[]> {
    return this.http.get<HistorialClinico[]>(`${this.apiUrl}/medico/${medicoId}`);
  }

  // Crear nuevo historial clínico
  createHistorialClinico(historialClinico: HistorialClinico): Observable<HistorialClinico> {
    return this.http.post<HistorialClinico>(this.apiUrl, historialClinico);
  }

  // Actualizar historial clínico
  updateHistorialClinico(id: number, historialClinico: HistorialClinico): Observable<HistorialClinico> {
    return this.http.put<HistorialClinico>(`${this.apiUrl}/${id}`, historialClinico);
  }

  // Eliminar historial clínico
  deleteHistorialClinico(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
  }
}