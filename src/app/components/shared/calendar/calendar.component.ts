import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CalendarEvent {
  id?: number;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  backgroundColor?: string;
  textColor?: string;
  allDay?: boolean;
  type?: 'cita' | 'disponible' | 'bloqueado';
  data?: any;
}

export interface CalendarView {
  type: 'month' | 'week' | 'day';
  date: Date;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="calendar-container bg-white rounded-2xl shadow-lg overflow-hidden">
      <!-- Header del Calendario -->
      <div class="calendar-header bg-gradient-to-r from-blue-600 to-teal-600 text-white p-6">
        <div class="flex items-center justify-between">
          <!-- Navegación de fecha -->
          <div class="flex items-center space-x-4">
            <button 
              (click)="previousPeriod()"
              class="p-2 rounded-lg hover:bg-white/20 transition-colors">
              <i class="pi pi-chevron-left text-lg"></i>
            </button>
            
            <div class="text-center">
              <h2 class="text-2xl font-bold">{{ getCurrentPeriodTitle() }}</h2>
              <p class="text-blue-100 text-sm">{{ getCurrentSubtitle() }}</p>
            </div>
            
            <button 
              (click)="nextPeriod()"
              class="p-2 rounded-lg hover:bg-white/20 transition-colors">
              <i class="pi pi-chevron-right text-lg"></i>
            </button>
          </div>

          <!-- Botones de vista -->
          <div class="flex bg-white/20 rounded-lg p-1">
            <button 
              *ngFor="let view of viewTypes"
              (click)="changeView(view.type)"
              [class]="currentView.type === view.type 
                ? 'bg-white text-blue-600' 
                : 'text-white hover:bg-white/20'"
              class="px-4 py-2 rounded-md text-sm font-medium transition-colors">
              {{ view.label }}
            </button>
          </div>

          <!-- Botón hoy -->
          <button 
            (click)="goToToday()"
            class="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Hoy
          </button>
        </div>
      </div>

      <!-- Contenido del Calendario -->
      <div class="calendar-content">
        <!-- Vista Mensual -->
        <div *ngIf="currentView.type === 'month'" class="month-view">
          <!-- Días de la semana -->
          <div class="grid grid-cols-7 border-b border-gray-200">
            <div 
              *ngFor="let day of weekDays"
              class="p-4 text-center font-semibold text-gray-600 bg-gray-50">
              {{ day }}
            </div>
          </div>
          
          <!-- Días del mes -->
          <div class="grid grid-cols-7 min-h-96">
            <div 
              *ngFor="let day of monthDays"
              [class]="getDayClasses(day)"
              class="border-r border-b border-gray-100 p-2 min-h-24 relative cursor-pointer hover:bg-blue-50 transition-colors"
              (click)="selectDay(day)">
              
              <!-- Número del día -->
              <div class="font-medium mb-1" [class]="getDayNumberClasses(day)">
                {{ day.getDate() }}
              </div>
              
              <!-- Eventos del día -->
              <div class="space-y-1">
                <div 
                  *ngFor="let event of getEventsForDay(day)"
                  [style.background-color]="event.backgroundColor || '#3b82f6'"
                  [style.color]="event.textColor || 'white'"
                  class="text-xs px-2 py-1 rounded truncate"
                  (click)="$event.stopPropagation(); selectEvent(event)">
                  {{ event.title }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Vista Semanal -->
        <div *ngIf="currentView.type === 'week'" class="week-view">
          <!-- Encabezado de la semana -->
          <div class="grid grid-cols-8 border-b border-gray-200">
            <div class="p-4"></div> <!-- Espacio para horarios -->
            <div 
              *ngFor="let day of weekDays"
              class="p-4 text-center">
              <div class="font-semibold text-gray-600">{{ day }}</div>
              <div 
                class="text-2xl font-bold mt-1"
                [class]="isToday(getWeekDay(day)) ? 'text-blue-600' : 'text-gray-800'">
                {{ getWeekDay(day).getDate() }}
              </div>
            </div>
          </div>
          
          <!-- Horas y eventos -->
          <div class="overflow-y-auto max-h-96">
            <div 
              *ngFor="let hour of hours"
              class="grid grid-cols-8 border-b border-gray-100">
              
              <!-- Hora -->
              <div class="p-2 text-sm text-gray-500 border-r border-gray-200 text-right">
                {{ formatHour(hour) }}
              </div>
              
              <!-- Días de la semana -->
              <div 
                *ngFor="let day of weekDays"
                class="border-r border-gray-100 min-h-12 relative cursor-pointer hover:bg-blue-50"
                (click)="selectTimeSlot(getWeekDay(day), hour)">
                
                <!-- Eventos en esta hora -->
                <div 
                  *ngFor="let event of getEventsForTimeSlot(getWeekDay(day), hour)"
                  [style.background-color]="event.backgroundColor || '#3b82f6'"
                  [style.color]="event.textColor || 'white'"
                  class="absolute inset-x-1 text-xs p-1 rounded m-0.5"
                  (click)="$event.stopPropagation(); selectEvent(event)">
                  {{ event.title }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Vista Diaria -->
        <div *ngIf="currentView.type === 'day'" class="day-view">
          <div class="p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold">
              {{ currentView.date | date:'EEEE, MMMM d, y':'es' }}
            </h3>
          </div>
          
          <div class="overflow-y-auto max-h-96">
            <div 
              *ngFor="let hour of hours"
              class="flex border-b border-gray-100">
              
              <!-- Hora -->
              <div class="w-20 p-4 text-sm text-gray-500 border-r border-gray-200 text-right">
                {{ formatHour(hour) }}
              </div>
              
              <!-- Eventos -->
              <div 
                class="flex-1 min-h-16 relative cursor-pointer hover:bg-blue-50 p-2"
                (click)="selectTimeSlot(currentView.date, hour)">
                
                <div 
                  *ngFor="let event of getEventsForTimeSlot(currentView.date, hour)"
                  [style.background-color]="event.backgroundColor || '#3b82f6'"
                  [style.color]="event.textColor || 'white'"
                  class="p-2 rounded mb-1 text-sm"
                  (click)="$event.stopPropagation(); selectEvent(event)">
                  <div class="font-medium">{{ event.title }}</div>
                  <div class="text-xs opacity-90">
                    {{ event.start | date:'shortTime' }} - {{ event.end | date:'shortTime' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  @Input() events: CalendarEvent[] = [];
  @Input() initialView: 'month' | 'week' | 'day' = 'month';
  @Input() initialDate: Date = new Date();

  @Output() eventClick = new EventEmitter<CalendarEvent>();
  @Output() dayClick = new EventEmitter<Date>();
  @Output() timeSlotClick = new EventEmitter<{date: Date, hour: number}>();

  currentView: CalendarView = {
    type: 'month',
    date: new Date()
  };

  viewTypes = [
    { type: 'month' as const, label: 'Mes' },
    { type: 'week' as const, label: 'Semana' },
    { type: 'day' as const, label: 'Día' }
  ];

  weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  hours = Array.from({ length: 24 }, (_, i) => i); // 0-23

  monthDays: Date[] = [];

  ngOnInit() {
    this.currentView = {
      type: this.initialView,
      date: new Date(this.initialDate)
    };
    this.updateCalendar();
  }

  updateCalendar() {
    if (this.currentView.type === 'month') {
      this.generateMonthDays();
    }
  }

  generateMonthDays() {
    const year = this.currentView.date.getFullYear();
    const month = this.currentView.date.getMonth();
    
    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    // Último día del mes
    const lastDay = new Date(year, month + 1, 0);
    
    // Días para mostrar (incluyendo días del mes anterior y siguiente)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    this.monthDays = [];
    const currentDate = new Date(startDate);
    
    // Generar 42 días (6 semanas)
    for (let i = 0; i < 42; i++) {
      this.monthDays.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  getCurrentPeriodTitle(): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    switch (this.currentView.type) {
      case 'month':
        return `${months[this.currentView.date.getMonth()]} ${this.currentView.date.getFullYear()}`;
      case 'week':
        const startOfWeek = this.getStartOfWeek(this.currentView.date);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${months[startOfWeek.getMonth()]}`;
      case 'day':
        return `${this.currentView.date.getDate()} ${months[this.currentView.date.getMonth()]}`;
      default:
        return '';
    }
  }

  getCurrentSubtitle(): string {
    switch (this.currentView.type) {
      case 'month':
        return 'Vista Mensual';
      case 'week':
        return 'Vista Semanal';
      case 'day':
        return 'Vista Diaria';
      default:
        return '';
    }
  }

  changeView(viewType: 'month' | 'week' | 'day') {
    this.currentView.type = viewType;
    this.updateCalendar();
  }

  previousPeriod() {
    const newDate = new Date(this.currentView.date);
    
    switch (this.currentView.type) {
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
    }
    
    this.currentView.date = newDate;
    this.updateCalendar();
  }

  nextPeriod() {
    const newDate = new Date(this.currentView.date);
    
    switch (this.currentView.type) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
    }
    
    this.currentView.date = newDate;
    this.updateCalendar();
  }

  goToToday() {
    this.currentView.date = new Date();
    this.updateCalendar();
  }

  getDayClasses(day: Date): string {
    const classes = [];
    
    if (!this.isCurrentMonth(day)) {
      classes.push('text-gray-300');
    }
    
    if (this.isToday(day)) {
      classes.push('bg-blue-100');
    }
    
    return classes.join(' ');
  }

  getDayNumberClasses(day: Date): string {
    const classes = [];
    
    if (this.isToday(day)) {
      classes.push('bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center');
    }
    
    return classes.join(' ');
  }

  isCurrentMonth(day: Date): boolean {
    return day.getMonth() === this.currentView.date.getMonth();
  }

  isToday(day: Date): boolean {
    const today = new Date();
    return day.toDateString() === today.toDateString();
  }

  getStartOfWeek(date: Date): Date {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    return start;
  }

  getWeekDay(dayName: string): Date {
    const startOfWeek = this.getStartOfWeek(this.currentView.date);
    const dayIndex = this.weekDays.indexOf(dayName);
    const weekDay = new Date(startOfWeek);
    weekDay.setDate(weekDay.getDate() + dayIndex);
    return weekDay;
  }

  formatHour(hour: number): string {
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    if (hour < 12) return `${hour}:00 AM`;
    return `${hour - 12}:00 PM`;
  }

  getEventsForDay(day: Date): CalendarEvent[] {
    return this.events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === day.toDateString();
    });
  }

  getEventsForTimeSlot(day: Date, hour: number): CalendarEvent[] {
    return this.events.filter(event => {
      const eventStart = new Date(event.start);
      const eventHour = eventStart.getHours();
      
      return eventStart.toDateString() === day.toDateString() && 
             eventHour === hour;
    });
  }

  selectDay(day: Date) {
    this.dayClick.emit(day);
  }

  selectTimeSlot(date: Date, hour: number) {
    this.timeSlotClick.emit({ date, hour });
  }

  selectEvent(event: CalendarEvent) {
    this.eventClick.emit(event);
  }
}