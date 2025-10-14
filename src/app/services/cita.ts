import { Injectable } from '@angular/core';
import { Cita } from '../models/cita.model';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

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
  getCitasProximasConLimite(usuarioId: number, limite: number): Observable<Cita[]> {
    return this.http.get<CitaProximaResponse[]>(`${this.apiUrl}/proximas/${usuarioId}/limit/${limite}`)
      .pipe(
        map(citasResponse => this.mapearCitasProximas(citasResponse))
      );
  }

  private mapearCitasProximas(citasResponse: CitaProximaResponse[]): Cita[] {
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
          // Propiedades requeridas con valores por defecto
          sexo: 'M',
          correoElectronico: '',
          idRol: 0
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
}