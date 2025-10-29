import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { PacienteDetalle } from '../models/pacienteDetalle.model';

@Injectable({
  providedIn: 'root'
})
export class PacienteService {
  private apiUrl = 'http://localhost:8080/api/paciente-detalle';

  constructor(private http: HttpClient) { }

  // Obtener paciente detalle por ID de usuario
  getPacienteDetalleByUsuarioId(usuarioId: number): Observable<PacienteDetalle> {
    return this.http.get<any>(`${this.apiUrl}/usuario/${usuarioId}`).pipe(
      map(response => {
        console.log('Respuesta cruda del backend:', response);
        
        // Mapear la respuesta del backend a nuestro modelo
        const pacienteDetalle: PacienteDetalle = {
            id: response.id, // El backend devuelve "id"
            usuario: response.usuario,
            tipoSangre: response.tipoSangre,
            alergias: response.alergias,
            idUsuario: response.usuario.idUsuario
        };
        
        console.log('PacienteDetalle mapeado:', pacienteDetalle);
        return pacienteDetalle;
      })
    );
  }

  // Obtener paciente detalle por ID
  getPacienteDetalleById(id: number): Observable<PacienteDetalle> {
    return this.http.get<PacienteDetalle>(`${this.apiUrl}/${id}`);
  }
}