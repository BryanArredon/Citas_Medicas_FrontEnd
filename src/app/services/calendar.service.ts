import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CalendarEvent } from '../components/shared/calendar/calendar.component';

export interface TimeSlot {
  date: Date;
  hour: number;
  minute: number;
  available: boolean;
  type: 'disponible' | 'ocupado' | 'bloqueado';
  medicoId?: number;
  citaId?: number;
}

export interface CalendarConfig {
  workingHours: {
    start: number; // hora de inicio (0-23)
    end: number;   // hora de fin (0-23)
  };
  slotDuration: number; // duración en minutos
  workingDays: number[]; // días de la semana (0=domingo, 6=sábado)
}

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private eventsSubject = new BehaviorSubject<CalendarEvent[]>([]);
  public events$ = this.eventsSubject.asObservable();

  private configSubject = new BehaviorSubject<CalendarConfig>({
    workingHours: { start: 8, end: 18 },
    slotDuration: 30,
    workingDays: [1, 2, 3, 4, 5] // Lunes a Viernes
  });
  public config$ = this.configSubject.asObservable();

  constructor() {}

  // ===============================
  // GESTIÓN DE EVENTOS
  // ===============================

  /**
   * Obtiene todos los eventos del calendario
   */
  getEvents(): CalendarEvent[] {
    return this.eventsSubject.getValue();
  }

  /**
   * Actualiza los eventos del calendario
   */
  setEvents(events: CalendarEvent[]): void {
    this.eventsSubject.next(events);
  }

  /**
   * Agrega un nuevo evento al calendario
   */
  addEvent(event: CalendarEvent): void {
    const currentEvents = this.getEvents();
    const newEvents = [...currentEvents, { ...event, id: this.generateEventId() }];
    this.setEvents(newEvents);
  }

  /**
   * Actualiza un evento existente
   */
  updateEvent(eventId: number, updatedEvent: Partial<CalendarEvent>): void {
    const currentEvents = this.getEvents();
    const newEvents = currentEvents.map(event => 
      event.id === eventId ? { ...event, ...updatedEvent } : event
    );
    this.setEvents(newEvents);
  }

  /**
   * Elimina un evento del calendario
   */
  deleteEvent(eventId: number): void {
    const currentEvents = this.getEvents();
    const newEvents = currentEvents.filter(event => event.id !== eventId);
    this.setEvents(newEvents);
  }

  // ===============================
  // GESTIÓN DE HORARIOS MÉDICOS
  // ===============================

  /**
   * Convierte agenda de médico a eventos de calendario
   */
  convertAgendaToEvents(agendas: any[]): CalendarEvent[] {
    const events: CalendarEvent[] = [];

    agendas.forEach(agenda => {
      const fecha = new Date(agenda.fecha);
      const [horaInicioHours, horaInicioMinutes] = agenda.horaInicio.split(':').map(Number);
      const [horaFinHours, horaFinMinutes] = agenda.horaFin.split(':').map(Number);

      const start = new Date(fecha);
      start.setHours(horaInicioHours, horaInicioMinutes, 0, 0);

      const end = new Date(fecha);
      end.setHours(horaFinHours, horaFinMinutes, 0, 0);

      events.push({
        id: agenda.id,
        title: `Dr. ${agenda.medico?.usuario?.nombre || 'Médico'} - Disponible`,
        start,
        end,
        backgroundColor: '#10b981',
        textColor: 'white',
        type: 'disponible',
        data: agenda
      });
    });

    return events;
  }

  /**
   * Convierte citas a eventos de calendario
   */
  convertCitasToEvents(citas: any[]): CalendarEvent[] {
    const events: CalendarEvent[] = [];

    citas.forEach(cita => {
      const fechaHora = new Date(cita.fechaHora);
      const end = new Date(fechaHora);
      end.setMinutes(end.getMinutes() + 30); // Asumimos 30 minutos por cita

      events.push({
        id: cita.id,
        title: `${cita.paciente?.usuario?.nombre || 'Paciente'} - ${cita.servicio?.nombre || 'Consulta'}`,
        start: fechaHora,
        end,
        backgroundColor: this.getColorByEstatus(cita.estatus),
        textColor: 'white',
        type: 'cita',
        data: cita
      });
    });

    return events;
  }

  // ===============================
  // UTILIDADES DE FECHA Y HORA
  // ===============================

  /**
   * Genera slots de tiempo disponibles para un día
   */
  generateTimeSlots(date: Date, medicoId?: number): TimeSlot[] {
    const config = this.configSubject.getValue();
    const slots: TimeSlot[] = [];

    // Verificar si es día laboral
    if (!config.workingDays.includes(date.getDay())) {
      return slots;
    }

    for (let hour = config.workingHours.start; hour < config.workingHours.end; hour++) {
      for (let minute = 0; minute < 60; minute += config.slotDuration) {
        const slotDate = new Date(date);
        slotDate.setHours(hour, minute, 0, 0);

        slots.push({
          date: slotDate,
          hour,
          minute,
          available: this.isSlotAvailable(slotDate, medicoId),
          type: this.getSlotType(slotDate, medicoId),
          medicoId
        });
      }
    }

    return slots;
  }

  /**
   * Verifica si un slot de tiempo está disponible
   */
  isSlotAvailable(dateTime: Date, medicoId?: number): boolean {
    const events = this.getEvents();
    
    return !events.some(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      return dateTime >= eventStart && dateTime < eventEnd &&
             (event.type === 'cita' || event.type === 'bloqueado') &&
             (!medicoId || event.data?.medicoId === medicoId);
    });
  }

  /**
   * Obtiene el tipo de slot según eventos existentes
   */
  getSlotType(dateTime: Date, medicoId?: number): 'disponible' | 'ocupado' | 'bloqueado' {
    const events = this.getEvents();
    
    const conflictingEvent = events.find(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      return dateTime >= eventStart && dateTime < eventEnd &&
             (!medicoId || event.data?.medicoId === medicoId);
    });

    if (conflictingEvent) {
      switch (conflictingEvent.type) {
        case 'cita': return 'ocupado';
        case 'bloqueado': return 'bloqueado';
        default: return 'disponible';
      }
    }

    return 'disponible';
  }

  /**
   * Obtiene eventos para un rango de fechas
   */
  getEventsInRange(startDate: Date, endDate: Date): CalendarEvent[] {
    const events = this.getEvents();
    
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= startDate && eventDate <= endDate;
    });
  }

  /**
   * Obtiene eventos para un día específico
   */
  getEventsForDate(date: Date): CalendarEvent[] {
    const events = this.getEvents();
    
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
  }

  // ===============================
  // UTILIDADES AUXILIARES
  // ===============================

  /**
   * Genera un ID único para eventos
   */
  private generateEventId(): number {
    return Date.now() + Math.random();
  }

  /**
   * Obtiene color según estatus de cita
   */
  private getColorByEstatus(estatus: any): string {
    const statusColors: { [key: string]: string } = {
      'programada': '#3b82f6',
      'confirmada': '#10b981',
      'en_proceso': '#f59e0b',
      'completada': '#059669',
      'cancelada': '#ef4444',
      'no_asistio': '#6b7280'
    };

    return statusColors[estatus?.nombre?.toLowerCase()] || '#3b82f6';
  }

  // ===============================
  // CONFIGURACIÓN
  // ===============================

  /**
   * Actualiza la configuración del calendario
   */
  updateConfig(config: Partial<CalendarConfig>): void {
    const currentConfig = this.configSubject.getValue();
    this.configSubject.next({ ...currentConfig, ...config });
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): CalendarConfig {
    return this.configSubject.getValue();
  }

  // ===============================
  // VALIDACIONES
  // ===============================

  /**
   * Valida si una fecha/hora es válida para agendar
   */
  validateScheduleTime(dateTime: Date, medicoId?: number): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const config = this.getConfig();

    // Verificar día laboral
    if (!config.workingDays.includes(dateTime.getDay())) {
      errors.push('No es un día laboral');
    }

    // Verificar horario laboral
    const hour = dateTime.getHours();
    if (hour < config.workingHours.start || hour >= config.workingHours.end) {
      errors.push('Fuera del horario laboral');
    }

    // Verificar disponibilidad
    if (!this.isSlotAvailable(dateTime, medicoId)) {
      errors.push('Horario no disponible');
    }

    // Verificar que no sea en el pasado
    if (dateTime < new Date()) {
      errors.push('No se puede agendar en el pasado');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ===============================
  // FORMATEO
  // ===============================

  /**
   * Formatea una fecha para mostrar
   */
  formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Formatea una hora para mostrar
   */
  formatTime(date: Date): string {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formatea duración entre dos fechas
   */
  formatDuration(start: Date, end: Date): string {
    const diff = end.getTime() - start.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  }
}