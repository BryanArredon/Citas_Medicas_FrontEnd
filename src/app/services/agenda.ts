import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Agenda } from '../models/agenda.model';
import { HorarioOcupado } from '../models/horarioOcupado.model';

@Injectable({
  providedIn: 'root'
})
export class AgendaService {
  private apiUrl = 'http://localhost:8080/api/agenda';

  constructor(private http: HttpClient) { }

  // Obtener todas las agendas
  getAllAgendas(): Observable<Agenda[]> {
    return this.http.get<Agenda[]>(this.apiUrl);
  }

  // Obtener agendas por médico
  getAgendasByMedico(medicoId: number): Observable<Agenda[]> {
    return this.http.get<Agenda[]>(`${this.apiUrl}/medico/${medicoId}`);
  }

  // Crear nueva agenda
  createAgenda(agenda: Agenda): Observable<Agenda> {
    return this.http.post<Agenda>(this.apiUrl, agenda);
  }

  // Obtener horarios OCUPADOS de un médico en una fecha específica
  getHorariosOcupados(idMedico: number, fecha: string): Observable<HorarioOcupado[]> {
    return this.http.get<HorarioOcupado[]>(`${this.apiUrl}/medico/${idMedico}/fecha/${fecha}`);
  }

  // Obtener agenda por ID
  getAgendaById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
}