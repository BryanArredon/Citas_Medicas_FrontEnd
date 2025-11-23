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
    console.log('Obteniendo médico para usuario:', userId);
    return this.http.get<any>(`http://localhost:8080/api/medicos/usuario/${userId}`).pipe(
      tap(res => console.log('Médico encontrado:', res)),
      catchError(error => {
        console.error('Error obteniendo médico:', error);
        // Si no existe el médico, crear uno genérico con el userId
        console.warn('No se encontró médico para usuario', userId, '- usando ID de usuario como médico ID');
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

  // Método simplificado que crea horario directamente con medicoId
  createSimple(medicoId: number, horarioData: Omit<HorarioMedicoPayload, 'medico'>): Observable<HorarioMedico> {
    console.log('Creando horario simple para médico ID:', medicoId);
    const payload = {
      ...horarioData,
      medico: {
        id: medicoId
      }
    } as HorarioMedicoPayload;
    
    console.log('Payload simple:', JSON.stringify(payload, null, 2));
    return this.create(payload);
  }

  // Método mejorado que obtiene el médico completo primero
  createWithMedicoId(medicoId: number, horarioData: Omit<HorarioMedicoPayload, 'medico'>): Observable<HorarioMedico> {
    console.log('Creando horario para médico ID:', medicoId);
    // Obtener el médico completo primero
    return this.http.get<any>(`http://localhost:8080/api/medicos/${medicoId}`).pipe(
      switchMap(medico => {
        console.log('Médico obtenido:', medico);
        const payload = {
          ...horarioData,
          medico: medico  // Usar el objeto médico completo
        };
        return this.create(payload);
      }),
      catchError(error => {
        console.error('Error obteniendo médico o creando horario:', error);
        return throwError(() => new Error('No se pudo crear el horario: ' + (error.error || error.message)));
      })
    );
  }

  // Método que crea horario obteniendo primero el médico por userId
  createWithUserId(userId: number, horarioData: Omit<HorarioMedicoPayload, 'medico'>): Observable<HorarioMedico> {
    console.log('Creando horario para usuario ID:', userId);
    // Primero obtener el médico asociado al usuario
    return this.getMedicoByUserId(userId).pipe(
      switchMap(medico => {
        if (!medico || !medico.id) {
          throw new Error('No se encontró un médico asociado a este usuario');
        }
        console.log('Médico encontrado por userId:', medico);
        const payload = {
          ...horarioData,
          medico: medico  // Usar el objeto médico completo
        };
        return this.create(payload);
      }),
      catchError(error => {
        console.error('Error obteniendo médico por userId:', error);
        // Si no se encuentra el médico, intentar crearlo primero
        console.warn('Fallback: intentando crear médico para usuario', userId);
        return this.createMedicoForUser(userId).pipe(
          switchMap(medico => {
            console.log('Médico creado exitosamente:', medico);
            const payload = {
              ...horarioData,
              medico: medico
            };
            return this.create(payload);
          }),
          catchError(createError => {
            console.error('Error creando médico:', createError);
            // Último fallback: usar userId como medicoId
            console.warn('Último fallback: usando userId como medicoId');
            return this.createSimple(userId, horarioData);
          })
        );
      })
    );
  }

  // Método para crear un médico a partir de un usuario
  private createMedicoForUser(userId: number): Observable<any> {
    console.log('Creando registro de médico para usuario:', userId);
    const medicoData = {
      idUsuario: userId,
      serviciosIds: [],
      cedulaProfecional: `AUTO-${userId}`
    };
    
    return this.http.post<any>('http://localhost:8080/api/medicos/con-servicios', medicoData).pipe(
      tap(res => console.log('Médico creado:', res)),
      catchError(error => {
        console.error('Error creando médico:', error);
        return throwError(() => new Error('No se pudo crear el médico'));
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
