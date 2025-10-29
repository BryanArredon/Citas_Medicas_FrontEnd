import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  // Crear nuevo médico
  createMedico(medico: any): Observable<MedicoDetalle> {
    return this.http.post<MedicoDetalle>(this.apiUrl, medico);
  }

  // Actualizar médico
  updateMedico(id: number, medico: any): Observable<MedicoDetalle> {
    return this.http.put<MedicoDetalle>(`${this.apiUrl}/${id}`, medico);
  }

  // Eliminar médico
  deleteMedico(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getMedicosByUsuario(usuarioId: number): Observable<MedicoDetalle[]> {
  return this.http.get<MedicoDetalle[]>(`${this.apiUrl}/usuario/${usuarioId}`);
}
}