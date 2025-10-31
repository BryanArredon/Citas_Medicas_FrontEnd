import { Injectable } from '@angular/core';
import { Cita } from '../models/cita.model';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { Sexo } from '../models/usuario.model';

// Interface para la respuesta del backend (DTO plano)
interface CitaProximaResponse {
  idCita: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  nombreMedico: string;
  apellidoPaternoMedico: string;
  apellidoMaternoMedico: string;
  nombreServicio: string;
  nombreArea: string;
  estatus: string;
  motivo: string;
  fechaSolicitud: string;
}

@Injectable({
  providedIn: 'root'
})
export class CitaService {
  private apiUrl = 'http://localhost:8080/api/citas';

  constructor(private http: HttpClient) { }

  // Obtener TODAS las citas próximas (sin límite)
  getCitasProximas(usuarioId: number): Observable<Cita[]> {
    return this.http.get<CitaProximaResponse[]>(`${this.apiUrl}/proximas/${usuarioId}`)
      .pipe(
        map(citasResponse => this.mapearCitasProximas(citasResponse))
      );
  }

  // Obtener citas próximas con límite
  // CitaService (fragmento)
getCitasProximasConLimite(usuarioId: string, limite: number): Observable<Cita[]> {
  return this.http.get<CitaProximaResponse[]>(`${this.apiUrl}/proximas/${usuarioId}/limit/${limite}`)
    .pipe(
      map(citasResponse => this.mapearCitasProximas(citasResponse ?? []))
    );
}

private mapearCitasProximas(citasResponse: CitaProximaResponse[] = []): Cita[] {
  if (!Array.isArray(citasResponse) || citasResponse.length === 0) {
    return [];
  }

  return citasResponse.map(citaResp => {
    const cita: Cita = {
      idCita: citaResp.idCita,
      fechaSolicitud: citaResp.fechaSolicitud,
      motivo: citaResp.motivo,
      agenda: {
        fecha: citaResp.fecha,
        horaInicio: citaResp.horaInicio,
        horaFin: citaResp.horaFin
      },
      medicoDetalle: {
        usuario: {
          nombre: citaResp.nombreMedico,
          apellidoPaterno: citaResp.apellidoPaternoMedico,
          apellidoMaterno: citaResp.apellidoMaternoMedico,
          sexo: Sexo.Masculino, // Valor por defecto, idealmente debería venir del backend
          correoElectronico: '',
          rolUser: {
            idRol: 2, // Asumiendo que 2 es el ID para médicos
            nombreRol: 'MEDICO'
          }
        }
      },
      servicio: {
        nombreServicio: citaResp.nombreServicio,
        area: {
          nombreArea: citaResp.nombreArea,
          estatus: true
        }
      },
      estatus: {
        nombre: citaResp.estatus
      }
    };
    return cita;
  });
}

  // Método para crear/agendar una nueva cita
  createCita(citaData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, citaData).pipe(
      catchError((error: any) => {
        console.error('Error al crear cita:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 🆕 NUEVO: Crea una cita CON pago previo
   * Este método envía la cita y el pago juntos.
   * El backend primero procesa el pago, y solo si es exitoso, crea la cita.
   * 
   * @param citaData Datos de la cita (pacienteId, medicoId, servicioId, fechaHora, motivo)
   * @param pagoData Datos del pago (idMetodoPago, idTarjeta)
   * @returns Observable con la respuesta que incluye cita y datos del pago
   */
  crearCitaConPago(citaData: any, pagoData: any): Observable<any> {
    const request = {
      cita: citaData,
      pago: pagoData
    };
    
    console.log('💳 Creando cita con pago previo:');
    console.log('📋 CITA DATA:', JSON.stringify(citaData, null, 2));
    console.log('💰 PAGO DATA:', JSON.stringify(pagoData, null, 2));
    console.log('📦 REQUEST COMPLETO:', JSON.stringify(request, null, 2));
    
    return this.http.post<any>(`${this.apiUrl}/con-pago`, request).pipe(
      catchError((error: any) => {
        console.error('❌ Error al crear cita con pago:', error);
        return throwError(() => error);
      })
    );
  }

  // Obtener citas de un médico
  getCitasByMedico(medicoId: number): Observable<Cita[]> {
    return this.http.get<CitaProximaResponse[]>(`${this.apiUrl}/medico/${medicoId}`)
      .pipe(
        map(citasResponse => this.mapearCitasProximas(citasResponse ?? [])),
        catchError((error: any) => {
          console.error('Error al obtener citas del médico:', error);
          return throwError(() => error);
        })
      );
  }

  // Aceptar una cita
  aceptarCita(citaId: number): Observable<any> {
    const url = `${this.apiUrl}/${citaId}/aceptar`;
    console.log('🌐 Llamando a:', url);
    return this.http.put<any>(url, {}, {
      headers: { 'Content-Type': 'application/json' }
    })
      .pipe(
        catchError((error: any) => {
          console.error('❌ Error HTTP al aceptar cita:', error);
          console.error('   Status:', error.status);
          console.error('   Mensaje:', error.message);
          console.error('   Error del servidor:', error.error);
          return throwError(() => error);
        })
      );
  }

  // Cancelar una cita
  cancelarCita(citaId: number): Observable<any> {
    const url = `${this.apiUrl}/${citaId}/cancelar`;
    console.log('🌐 Llamando a:', url);
    return this.http.put<any>(url, {}, {
      headers: { 'Content-Type': 'application/json' }
    })
      .pipe(
        catchError((error: any) => {
          console.error('❌ Error HTTP al cancelar cita:', error);
          console.error('   Status:', error.status);
          console.error('   Mensaje:', error.message);
          console.error('   Error del servidor:', error.error);
          return throwError(() => error);
        })
      );
  }

  // Posponer una cita
  posponerCita(citaId: number, nuevaFecha: string): Observable<any> {
    const url = `${this.apiUrl}/${citaId}/posponer`;
    const body = { nuevaFecha };
    console.log('🌐 Llamando a:', url);
    console.log('📦 Body:', body);
    return this.http.put<any>(url, body, {
      headers: { 'Content-Type': 'application/json' }
    })
      .pipe(
        catchError((error: any) => {
          console.error('❌ Error HTTP al posponer cita:', error);
          console.error('   Status:', error.status);
          console.error('   Mensaje:', error.message);
          console.error('   Error del servidor:', error.error);
          return throwError(() => error);
        })
      );
  }

  // ===============================
  // MÉTODOS DE PAGO
  // ===============================

  /**
   * Procesa el pago de una cita
   * @param citaId ID de la cita
   * @param pagoData Datos del pago (idMetodoPago, idTarjeta)
   * @returns Observable con la respuesta del pago
   */
  procesarPago(citaId: number, pagoData: any): Observable<any> {
    const url = `${this.apiUrl}/${citaId}/pagar`;
    console.log('💳 Procesando pago para cita:', citaId);
    console.log('📦 Datos de pago:', pagoData);
    
    return this.http.post<any>(url, pagoData, {
      headers: { 'Content-Type': 'application/json' }
    }).pipe(
      catchError((error: any) => {
        console.error('❌ Error al procesar pago:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Consulta el estado del pago de una cita
   * @param citaId ID de la cita
   * @returns Observable con el estado del pago
   */
  consultarEstadoPago(citaId: number): Observable<any> {
    const url = `${this.apiUrl}/${citaId}/pago`;
    console.log('🔍 Consultando estado de pago para cita:', citaId);
    
    return this.http.get<any>(url).pipe(
      catchError((error: any) => {
        console.error('❌ Error al consultar estado de pago:', error);
        return throwError(() => error);
      })
    );
  }
}