import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { Menu } from 'primeng/menu';

// Importar componentes del calendario
import { CalendarComponent, CalendarEvent } from '../../shared/calendar/calendar.component';
import { CitaModalComponent, CitaModalData } from '../../shared/cita-modal/cita-modal.component';

// Servicios
import { AgendaService } from '../../../services/agenda.service';
import { CalendarService } from '../../../services/calendar.service';
import { CitaService } from '../../../services/cita';
// import { MedicoService } from '../../../services/medico';

// Modelos
import { Agenda } from '../../../models/agenda.model';

@Component({
  selector: 'app-agenda-medico-calendar',
  standalone: true,
  imports: [
    CommonModule, 
    MenuModule, 
    CalendarComponent, 
    CitaModalComponent
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <!-- Navbar Fixed -->
      <nav class="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md shadow-md border-b border-gray-100">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-20">
            <!-- Logo y título -->
            <div class="flex items-center space-x-12">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                  <i class="pi pi-calendar text-white text-xl"></i>
                </div>
                <div>
                  <h1 class="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                    Agenda Médica
                  </h1>
                  <p class="text-xs text-gray-500 -mt-1">Gestión de Horarios y Citas</p>
                </div>
              </div>

              <!-- Navegación de módulos -->
              <div class="hidden md:flex items-center space-x-2">
                <button
                  (click)="selectModule('calendario')"
                  [class]="activeModule === 'calendario'
                    ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg shadow-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'"
                  class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105">
                  <i class="pi pi-calendar mr-2"></i>
                  Calendario
                </button>
                <button
                  (click)="selectModule('agenda')"
                  [class]="activeModule === 'agenda'
                    ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg shadow-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'"
                  class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105">
                  <i class="pi pi-clock mr-2"></i>
                  Horarios
                </button>
                <button
                  (click)="selectModule('estadisticas')"
                  [class]="activeModule === 'estadisticas'
                    ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg shadow-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'"
                  class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105">
                  <i class="pi pi-chart-bar mr-2"></i>
                  Estadísticas
                </button>
              </div>
            </div>

            <!-- Acciones rápidas -->
            <div class="flex items-center space-x-4">
              <!-- Botón nueva cita -->
              <button
                (click)="abrirModalNuevaCita()"
                class="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <i class="pi pi-plus mr-2"></i>
                Nueva Cita
              </button>

              <!-- Perfil -->
              <div class="relative">
                <button 
                  (click)="menu.toggle($event)"
                  class="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                    {{ getInitials() }}
                  </div>
                  <div class="hidden sm:block text-left">
                    <p class="font-semibold text-gray-800">{{ userName }}</p>
                    <p class="text-xs text-gray-500">Médico</p>
                  </div>
                  <i class="pi pi-chevron-down text-gray-400 text-sm"></i>
                </button>
                <p-menu #menu [model]="profileMenuItems" [popup]="true"></p-menu>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <!-- Contenido Principal -->
      <div class="pt-24 pb-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <!-- Vista de Calendario -->
          <div *ngIf="activeModule === 'calendario'" class="space-y-6">
            <!-- Header con estadísticas rápidas -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div class="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-600">Citas Hoy</p>
                    <p class="text-3xl font-bold text-blue-600">{{ estadisticas.citasHoy }}</p>
                  </div>
                  <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <i class="pi pi-calendar-plus text-blue-600 text-xl"></i>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-600">Esta Semana</p>
                    <p class="text-3xl font-bold text-green-600">{{ estadisticas.citasSemana }}</p>
                  </div>
                  <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <i class="pi pi-chart-line text-green-600 text-xl"></i>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-600">Disponibles</p>
                    <p class="text-3xl font-bold text-teal-600">{{ estadisticas.horariosDisponibles }}</p>
                  </div>
                  <div class="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                    <i class="pi pi-clock text-teal-600 text-xl"></i>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-600">Completadas</p>
                    <p class="text-3xl font-bold text-purple-600">{{ estadisticas.citasCompletadas }}</p>
                  </div>
                  <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <i class="pi pi-check-circle text-purple-600 text-xl"></i>
                  </div>
                </div>
              </div>
            </div>

            <!-- Calendario Principal -->
            <div class="bg-white rounded-2xl shadow-lg">
              <app-calendar
                [events]="calendarEvents"
                [initialView]="'week'"
                (eventClick)="onEventClick($event)"
                (dayClick)="onDayClick($event)"
                (timeSlotClick)="onTimeSlotClick($event)">
              </app-calendar>
            </div>
          </div>

          <!-- Vista de Horarios -->
          <div *ngIf="activeModule === 'agenda'" class="space-y-6">
            <div class="bg-white rounded-2xl shadow-lg p-6">
              <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-800">Gestión de Horarios</h2>
                <button 
                  (click)="abrirModalHorario()"
                  class="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <i class="pi pi-plus mr-2"></i>
                  Nuevo Horario
                </button>
              </div>

              <!-- Lista de horarios -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div 
                  *ngFor="let agenda of agendas"
                  class="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300 cursor-pointer"
                  (click)="seleccionarAgenda(agenda)">
                  
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center space-x-2">
                      <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span class="font-semibold text-gray-800">Disponible</span>
                    </div>
                    <span class="text-sm text-gray-500">{{ agenda.fecha | date:'shortDate' }}</span>
                  </div>
                  
                  <div class="space-y-2">
                    <div class="flex items-center text-gray-600">
                      <i class="pi pi-clock mr-2 text-blue-500"></i>
                      <span>{{ agenda.horaInicio }} - {{ agenda.horaFin }}</span>
                    </div>
                    <div class="flex items-center text-gray-600">
                      <i class="pi pi-user-md mr-2 text-teal-500"></i>
                      <span>Dr. {{ agenda.medicoDetalle?.usuario?.nombre || 'Médico' }}</span>
                    </div>
                  </div>
                  
                  <div class="mt-4 flex justify-end space-x-2">
                    <button 
                      (click)="$event.stopPropagation(); editarAgenda(agenda)"
                      class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <i class="pi pi-pencil"></i>
                    </button>
                    <button 
                      (click)="$event.stopPropagation(); eliminarAgenda(agenda)"
                      class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Vista de Estadísticas -->
          <div *ngIf="activeModule === 'estadisticas'" class="space-y-6">
            <div class="bg-white rounded-2xl shadow-lg p-6">
              <h2 class="text-2xl font-bold text-gray-800 mb-6">Estadísticas de Citas</h2>
              
              <!-- Gráficos y métricas -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Aquí irían los componentes de gráficos -->
                <div class="bg-gray-50 rounded-xl p-6 text-center">
                  <i class="pi pi-chart-pie text-4xl text-gray-400 mb-4"></i>
                  <p class="text-gray-600">Gráfico de distribución de citas</p>
                  <p class="text-sm text-gray-500 mt-2">Próximamente</p>
                </div>
                
                <div class="bg-gray-50 rounded-xl p-6 text-center">
                  <i class="pi pi-chart-bar text-4xl text-gray-400 mb-4"></i>
                  <p class="text-gray-600">Tendencias mensuales</p>
                  <p class="text-sm text-gray-500 mt-2">Próximamente</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Loading overlay -->
      <div *ngIf="loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-2xl p-8 flex items-center space-x-4">
          <i class="pi pi-spin pi-spinner text-2xl text-blue-600"></i>
          <span class="text-lg font-medium">Cargando...</span>
        </div>
      </div>
    </div>

    <!-- Modal para citas -->
    <app-cita-modal
      [visible]="showCitaModal"
      [citaData]="citaModalData"
      [editingEvent]="editingEvent"
      (close)="cerrarModalCita()"
      (save)="guardarCita($event)">
    </app-cita-modal>
  `,
  styleUrls: ['./agenda-medico-calendar.component.css']
})
export class AgendaMedicoCalendarComponent implements OnInit {
  // Estado de la vista
  activeModule: string = 'calendario';
  loading: boolean = false;

  // Datos del usuario
  userName: string = '';

  // Datos del calendario
  calendarEvents: CalendarEvent[] = [];
  agendas: Agenda[] = [];

  // Modal de citas
  showCitaModal = false;
  citaModalData: CitaModalData | null = null;
  editingEvent: CalendarEvent | null = null;

  // Estadísticas
  estadisticas = {
    citasHoy: 0,
    citasSemana: 0,
    horariosDisponibles: 0,
    citasCompletadas: 0
  };

  // Menú de perfil
  profileMenuItems: MenuItem[] = [
    {
      label: 'Mi Perfil',
      icon: 'pi pi-user',
      command: () => this.router.navigate(['/account'])
    },
    {
      label: 'Configuración',
      icon: 'pi pi-cog',
      command: () => this.router.navigate(['/settings'])
    },
    {
      separator: true
    },
    {
      label: 'Cerrar Sesión',
      icon: 'pi pi-sign-out',
      command: () => this.logout()
    }
  ];

  @ViewChild('menu') menu!: Menu;

  constructor(
    private agendaService: AgendaService,
    private calendarService: CalendarService,
    private citaService: CitaService,
    // private medicoService: MedicoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadData();
  }

  // ===============================
  // INICIALIZACIÓN
  // ===============================

  loadUserInfo() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.userName = user.nombre ? `${user.nombre} ${user.apellidoPaterno}` : 'Usuario';
  }

  async loadData() {
    this.loading = true;
    try {
      // Cargar agendas
      await this.loadAgendas();
      
      // Cargar citas
      await this.loadCitas();
      
      // Actualizar estadísticas
      this.updateEstadisticas();
      
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      this.loading = false;
    }
  }

  async loadAgendas() {
    try {
      this.agendas = await this.agendaService.getAllAgendas().toPromise() || [];
      
      // Convertir agendas a eventos de calendario
      const agendaEvents = this.calendarService.convertAgendaToEvents(this.agendas);
      
      // Actualizar eventos del calendario
      const currentEvents = this.calendarService.getEvents();
      const citasEvents = currentEvents.filter(event => event.type === 'cita');
      this.calendarEvents = [...agendaEvents, ...citasEvents];
      
    } catch (error) {
      console.error('Error cargando agendas:', error);
    }
  }

  async loadCitas() {
    try {
      // Aquí cargarías las citas desde el servicio
      // const citas = await this.citaService.findAll().toPromise() || [];
      
      // Por ahora, citas de ejemplo
      const citas: any[] = [];
      
      const citasEvents = this.calendarService.convertCitasToEvents(citas);
      
      // Agregar citas a eventos existentes
      const agendaEvents = this.calendarEvents.filter(event => event.type === 'disponible');
      this.calendarEvents = [...agendaEvents, ...citasEvents];
      
    } catch (error) {
      console.error('Error cargando citas:', error);
    }
  }

  updateEstadisticas() {
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);

    // Calcular estadísticas basadas en eventos
    const citasHoy = this.calendarEvents.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === hoy.toDateString() && event.type === 'cita';
    }).length;

    const citasSemana = this.calendarEvents.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= inicioSemana && eventDate <= finSemana && event.type === 'cita';
    }).length;

    const horariosDisponibles = this.calendarEvents.filter(event => 
      event.type === 'disponible'
    ).length;

    const citasCompletadas = this.calendarEvents.filter(event => 
      event.type === 'cita' && event.data?.estatus?.nombre === 'completada'
    ).length;

    this.estadisticas = {
      citasHoy,
      citasSemana,
      horariosDisponibles,
      citasCompletadas
    };
  }

  // ===============================
  // NAVEGACIÓN
  // ===============================

  selectModule(module: string) {
    this.activeModule = module;
  }

  getInitials(): string {
    const names = this.userName.split(' ');
    return names.map(name => name.charAt(0)).join('').toUpperCase().substring(0, 2);
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  // ===============================
  // EVENTOS DEL CALENDARIO
  // ===============================

  onEventClick(event: CalendarEvent) {
    console.log('Evento clickeado:', event);
    if (event.type === 'cita') {
      this.editingEvent = event;
      this.showCitaModal = true;
    } else if (event.type === 'disponible') {
      // Crear nueva cita en este horario
      const start = new Date(event.start);
      this.citaModalData = {
        fecha: start,
        hora: start.getHours(),
        medicoId: event.data?.medicoId
      };
      this.showCitaModal = true;
    }
  }

  onDayClick(date: Date) {
    console.log('Día clickeado:', date);
    this.citaModalData = {
      fecha: date,
      hora: 9 // Hora por defecto
    };
    this.showCitaModal = true;
  }

  onTimeSlotClick(data: {date: Date, hour: number}) {
    console.log('Slot de tiempo clickeado:', data);
    this.citaModalData = {
      fecha: data.date,
      hora: data.hour
    };
    this.showCitaModal = true;
  }

  // ===============================
  // GESTIÓN DE MODALES
  // ===============================

  abrirModalNuevaCita() {
    this.citaModalData = {
      fecha: new Date(),
      hora: 9
    };
    this.editingEvent = null;
    this.showCitaModal = true;
  }

  cerrarModalCita() {
    this.showCitaModal = false;
    this.citaModalData = null;
    this.editingEvent = null;
  }

  async guardarCita(citaData: any) {
    try {
      this.loading = true;
      
      if (this.editingEvent) {
        // Actualizar cita existente
        console.log('Actualizando cita:', citaData);
        // await this.citaService.update(citaData.id, citaData).toPromise();
      } else {
        // Crear nueva cita
        console.log('Creando nueva cita:', citaData);
        // await this.citaService.save(citaData).toPromise();
      }
      
      // Recargar datos
      await this.loadCitas();
      
    } catch (error) {
      console.error('Error guardando cita:', error);
    } finally {
      this.loading = false;
    }
  }

  // ===============================
  // GESTIÓN DE HORARIOS
  // ===============================

  abrirModalHorario() {
    console.log('Abrir modal de horario');
    // Implementar modal de horarios
  }

  seleccionarAgenda(agenda: Agenda) {
    console.log('Agenda seleccionada:', agenda);
  }

  editarAgenda(agenda: Agenda) {
    console.log('Editar agenda:', agenda);
  }

  eliminarAgenda(agenda: Agenda) {
    if (confirm('¿Está seguro de eliminar este horario?')) {
      console.log('Eliminar agenda:', agenda);
      // Implementar eliminación
    }
  }
}