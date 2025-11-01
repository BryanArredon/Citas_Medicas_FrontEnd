import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { MedicoDetalle } from '../models/medicoDetalle.model';

@Injectable({
  providedIn: 'root'
})
export class MedicoService {
  private apiUrl = 'http://localhost:8080/api/medicos';

  constructor(private http: HttpClient) { }

  // Obtener todos los médicos
  getAllMedicos(): Observable<MedicoDetalle[]> {
    return this.http.get<MedicoDetalle[]>(this.apiUrl);
  }

  // Obtener médico por ID
  getMedicoById(id: number): Observable<MedicoDetalle> {
    return this.http.get<MedicoDetalle>(`${this.apiUrl}/${id}`);
  }

  // Obtener médicos por servicio
  getMedicosByServicio(servicioId: number): Observable<MedicoDetalle[]> {
    return this.http.get<MedicoDetalle[]>(`${this.apiUrl}/servicio/${servicioId}`);
  }

  // Crear médico con múltiples servicios
  createMedicoWithServices(medicoData: any): Observable<MedicoDetalle[]> {
    return this.http.post<MedicoDetalle[]>(`${this.apiUrl}/con-servicios`, medicoData);
  }

  // Actualizar médico con múltiples servicios
  updateMedicoWithServices(usuarioId: number, medicoData: any): Observable<MedicoDetalle[]> {
    return this.http.put<MedicoDetalle[]>(`${this.apiUrl}/usuario/${usuarioId}`, medicoData);
  }

  // Crear nuevo médico (individual)
  createMedico(medico: any): Observable<MedicoDetalle> {
    return this.http.post<MedicoDetalle>(this.apiUrl, medico);
  }

  // Actualizar médico (individual)
  updateMedico(id: number, medico: any): Observable<MedicoDetalle> {
    return this.http.put<MedicoDetalle>(`${this.apiUrl}/${id}`, medico);
  }

  // Eliminar médico por ID
  deleteMedico(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Eliminar todos los registros de médico por usuario ID
  deleteMedicosByUsuario(usuarioId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  // Obtener médicos por usuario ID
  getMedicosByUsuario(usuarioId: number): Observable<MedicoDetalle[]> {
    return this.http.get<MedicoDetalle>(`${this.apiUrl}/usuario/${usuarioId}`).pipe(
      map(medico => [medico])
    );
  }

  getMedicoByUsuario(usuarioId: number): Observable<MedicoDetalle> {
    return this.http.get<MedicoDetalle>(`${this.apiUrl}/usuario/${usuarioId}`);
  }
}