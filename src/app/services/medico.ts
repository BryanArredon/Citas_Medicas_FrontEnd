import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, throwError, tap } from 'rxjs';
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

  // Obtener médicos agrupados por usuario con todos sus servicios
  getMedicosConServicios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/con-servicios`);
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

  // Obtener información completa del médico por usuario ID
  getMedicoInfoByUsuario(usuarioId: number): Observable<{usuario: any, servicios: any[], cedulaProfesional: string}> {
    return this.http.get<{usuario: any, servicios: any[], cedulaProfesional: string}>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  // Obtener solo los servicios del médico por usuario ID
  getServiciosByUsuario(usuarioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/usuario/${usuarioId}/servicios`);
  }

  // Obtener médicos por usuario ID (maneja tanto objeto único como array)
  getMedicosByUsuario(usuarioId: number): Observable<MedicoDetalle[]> {
    // Usar el nuevo endpoint que devuelve los registros de médicos con IDs
    return this.http.get<MedicoDetalle[]>(`${this.apiUrl}/registros/usuario/${usuarioId}`).pipe(
      map(response => {
        // Asegurar que siempre devuelva un array
        if (Array.isArray(response)) {
          return response;
        }
        // Si por alguna razón no es un array, convertirlo
        return response ? [response] : [];
      }),
      catchError(error => {
        console.warn('Fallback: usando endpoint anterior para médicos por usuario');
        // Fallback al endpoint anterior si el nuevo falla
        return this.http.get<MedicoDetalle | MedicoDetalle[]>(`${this.apiUrl}/usuario/${usuarioId}`).pipe(
          map(response => {
            if (Array.isArray(response)) {
              return response;
            }
            return [response];
          })
        );
      })
    );
  }

  getMedicoByUsuario(usuarioId: number): Observable<MedicoDetalle> {
    return this.http.get<MedicoDetalle>(`${this.apiUrl}/usuario/${usuarioId}`).pipe(
      catchError(error => {
        if (error.status === 404) {
          console.log('Médico no encontrado, creando automáticamente para usuario:', usuarioId);
          return this.createMedicoForUser(usuarioId);
        } else {
          return throwError(() => error);
        }
      })
    );
  }

  private createMedicoForUser(userId: number): Observable<MedicoDetalle> {
    console.log('Creando registro de médico para usuario:', userId);
    const medicoData = {
      idUsuario: userId,
      serviciosIds: [],
      cedulaProfecional: `AUTO-${userId}`
    };
    
    return this.http.post<MedicoDetalle>(`${this.apiUrl}/con-servicios`, medicoData).pipe(
      tap(res => console.log('Médico creado automáticamente:', res)),
      catchError(error => {
        console.error('Error creando médico automáticamente:', error);
        return throwError(() => new Error('No se pudo crear el médico automáticamente'));
      })
    );
  }
}