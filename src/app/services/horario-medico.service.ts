import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, switchMap } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HorarioMedico, EstadoMedico } from '../models/horarioMedico.model';

export type HorarioMedicoPayload = HorarioMedico;

@Injectable({ providedIn: 'root' })
export class HorarioMedicoService {
  private apiUrl = 'http://localhost:8080/api/horarios';

  constructor(private http: HttpClient) {}

  getMedicoByUserId(userId: number): Observable<any> {
    const url = `http://localhost:8080/api/medicos/usuario/${userId}`;
    console.log('Obteniendo médico para usuario:', userId);
    return this.http.get(url).pipe(
      tap(res => console.log('Datos del médico obtenidos:', res)),
      catchError(error => {
        console.error('Error obteniendo médico:', error);
        return throwError(() => new Error('No se pudo obtener la información del médico'));
      })
    );
  }

  create(payload: HorarioMedicoPayload): Observable<HorarioMedico> {
    console.log('Creando horario - Payload completo:', JSON.stringify(payload, null, 2));
    return this.http.post<HorarioMedico>(this.apiUrl, payload).pipe(
      tap(res => console.log('Respuesta crear horario:', res)),
      catchError(error => {
        console.error('Error detallado:', {
          status: error.status,
          message: error.message,
          error: error.error
        });
        return this.handleError(error);
      })
    );
  }

  createForUser(userId: number, horarioData: Omit<HorarioMedicoPayload, 'medico'>): Observable<HorarioMedico> {
    console.log('Creando horario para usuario:', userId, 'con datos:', horarioData);
    return this.getMedicoByUserId(userId).pipe(
      switchMap(medico => {
        if (!medico) {
          throw new Error('No se encontró el médico asociado al usuario');
        }
        const payload = {
          ...horarioData,
          medico: { id: medico.id }  // Usar solo el ID del médico
        };
        return this.create(payload);
      })
    );
  }

  /** Crear un horario para un médico existente usando el endpoint global */
  createForMedico(medicoId: number, payload: HorarioMedicoPayload): Observable<HorarioMedico> {
    const body = { ...payload, medico: { id: medicoId } } as HorarioMedicoPayload;
    return this.create(body);
  }

  /** Crear para un médico usando POST /api/medicos/{id}/horarios */
  createBatchForMedico(medicoId: number, payloads: HorarioMedicoPayload[]): Observable<HorarioMedico[]> {
    const url = `http://localhost:8080/api/medicos/${medicoId}/horarios`;
    console.log('Creando batch horarios para medico', medicoId, payloads);
    return this.http.post<HorarioMedico[]>(url, payloads).pipe(
      tap(res => console.log('Respuesta crear batch horarios:', res)),
      catchError(this.handleError)
    );
  }

  /** Listar horarios por userId usando endpoint del backend que devuelve los horarios del médico asociado al usuario */
  listByUsuario(userId: number) {
    const url = `http://localhost:8080/api/medicos/usuario/${userId}/horarios`;
    return this.http.get<HorarioMedico[]>(url).pipe(
      tap(res => console.log('Horarios por usuario:', res)),
      catchError(this.handleError)
    );
  }

  /** Listar horarios por correo del usuario */
  listByUsuarioEmail(email: string) {
    const url = `http://localhost:8080/api/medicos/email/horarios?correo=${encodeURIComponent(email)}`;
    return this.http.get<HorarioMedico[]>(url).pipe(
      tap(res => console.log('Horarios por email:', res)),
      catchError(this.handleError)
    );
  }

  update(id: number, payload: HorarioMedicoPayload): Observable<HorarioMedico> {
    return this.http.put<HorarioMedico>(`${this.apiUrl}/${id}`, payload).pipe(
      tap(res => console.log('Respuesta update horario:', res)),
      catchError(this.handleError)
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => console.log('Horario eliminado:', id)),
      catchError(this.handleError)
    );
  }

  listByMedico(medicoId: number): Observable<HorarioMedico[]> {
    return this.http.get<HorarioMedico[]>(`${this.apiUrl}/medico/${medicoId}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Horario service error:', error);
    return throwError(() => new Error(error.message || 'Error en HorarioService'));
  }
}
