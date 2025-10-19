import { Injectable } from '@angular/core';
import { Cita } from '../models/cita.model';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
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
}