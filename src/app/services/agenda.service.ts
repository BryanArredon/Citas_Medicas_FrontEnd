import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Agenda } from '../models/agenda.model';

@Injectable({
  providedIn: 'root'
})
export class AgendaService {
  private apiUrl = 'http://localhost:8080/api/agendas';

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
}