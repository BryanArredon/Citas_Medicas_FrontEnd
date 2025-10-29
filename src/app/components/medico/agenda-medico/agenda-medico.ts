import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgendaService } from '../../../services/agenda.service';
import { AgendaService } from '../../../services/agenda';
import { Agenda } from '../../../models/agenda.model';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { Menu } from 'primeng/menu';

// Importar componentes del calendario
import { CalendarComponent, CalendarEvent } from '../../shared/calendar/calendar.component';
import { CitaModalComponent, CitaModalData } from '../../shared/cita-modal/cita-modal.component';
import { CalendarService } from '../../../services/calendar.service';

@Component({
  selector: 'app-agenda-medico',
  standalone: true,
  imports: [
    CommonModule, 
    MenuModule, 
    FormsModule,
    CalendarComponent, 
    CitaModalComponent
  ],
  templateUrl: './agenda-medico.html',
  styleUrl: './agenda-medico.css'
})
export class AgendaMedico implements OnInit {
  agendas: Agenda[] = [];
  loading: boolean = false;

  // Nuevas propiedades para el navbar moderno
  activeModule: string = 'agenda';
  activeView: string = 'lista'; // 'lista' o 'calendario'
  userName: string = '';

  // Propiedades del calendario
  calendarEvents: CalendarEvent[] = [];
  showCitaModal = false;
  citaModalData: CitaModalData | null = null;
  editingEvent: CalendarEvent | null = null;

  // Propiedades del modal de citas
  showModal = false;
  selectedCita: any = null;
  isEditingCita = false;

  profileMenuItems: MenuItem[] = [
    {
      label: 'Mi Perfil',
      icon: 'pi pi-user',
      command: () => this.router.navigate(['/account'])
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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadAgendas();
    this.updateCalendarEvents();
  }

  loadUserInfo() {
    const userName = localStorage.getItem('userName') || localStorage.getItem('userEmail') || 'Usuario';
    this.userName = userName.split('@')[0]; // Remover dominio del email si existe
  }

  loadAgendas(): void {
    this.loading = true;
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');

    // Pequeño retraso para mostrar el mensaje de carga
    setTimeout(() => {
      if (userId && userRole === '2') { // Rol 2 = Médico
        this.agendaService.getAgendasByMedico(Number(userId)).subscribe({
          next: (agendas) => {
          this.agendas = agendas;
          this.loading = false;
          this.updateCalendarEvents();
          console.log('Agendas cargadas para médico:', agendas);
        },
          error: (error) => {
            console.warn('No se pudieron cargar agendas específicas del médico, intentando método alternativo:', error);
            // Si falla, intentar método alternativo
            this.loadAgendasAlternative();
          }
        });
      } else {
        console.error('No se encontró información del médico logueado');
        this.loading = false;
      }
    }, 100); // 800ms de retraso para mostrar el mensaje amigable
  }

  private loadAgendasAlternative(): void {
    // Método alternativo: obtener todas las agendas
    // Esto es útil para desarrollo/testing cuando no hay datos específicos
    setTimeout(() => {
      this.agendaService.getAllAgendas().subscribe({
        next: (allAgendas) => {
          // Para desarrollo, mostrar todas las agendas
          // En producción, podrías filtrar por médico si es necesario
          this.agendas = allAgendas;
          this.loading = false;
          this.updateCalendarEvents();
          console.log('Agendas cargadas (método alternativo):', this.agendas);
        },
        error: (error) => {
          console.error('Error al cargar agendas alternativas:', error);
          this.agendas = []; // Asegurar que sea un array vacío
          this.loading = false;
        }
      });
    }, 500); // Menos retraso para el método alternativo
  }

  selectModule(module: string) {
    this.activeModule = module;
    switch (module) {
      case 'areas':
        this.router.navigate(['/areas']);
        break;
      case 'servicios':
        this.router.navigate(['/servicios']);
        break;
      case 'medicos':
        this.router.navigate(['/medicos']);
        break;
      case 'mis-citas':
        this.router.navigate(['/cita-list']);
        break;
    }
  }

  volverAHorarios(): void {
    this.router.navigate(['/medicos']);
  }

  getCitasHoy(): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return this.agendas.filter(agenda => {
      const fechaCita = new Date(agenda.fecha);
      fechaCita.setHours(0, 0, 0, 0);
      return fechaCita.getTime() === hoy.getTime();
    }).length;
  }

  getCitasSemana(): number {
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);

    return this.agendas.filter(agenda => {
      const fechaCita = new Date(agenda.fecha);
      return fechaCita >= inicioSemana && fechaCita <= finSemana;
    }).length;
  }

  getCitasProximas(): number {
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);

    const enUnaSemana = new Date(hoy);
    enUnaSemana.setDate(hoy.getDate() + 7);

    return this.agendas.filter(agenda => {
      const fechaCita = new Date(agenda.fecha);
      return fechaCita > hoy && fechaCita <= enUnaSemana;
    }).length;
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/home']);
  }

  // ===============================
  // MÉTODOS DEL CALENDARIO
  // ===============================

  updateCalendarEvents() {
    // Convertir agendas a eventos de calendario
    this.calendarEvents = this.calendarService.convertAgendaToEvents(this.agendas);
  }

  changeView(view: string) {
    this.activeView = view;
  }

  // Eventos del calendario
  onEventClick(event: CalendarEvent) {
    console.log('Evento clickeado:', event);
    if (event.type === 'disponible') {
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

  // Gestión de modales
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

  closeCitaModal() {
    this.showModal = false;
    this.selectedCita = null;
    this.isEditingCita = false;
  }

  async handleSaveCita(citaData: any) {
    try {
      this.loading = true;
      
      console.log('Guardando cita:', citaData);
      // Aquí integrarías con tu servicio de citas
      // if (this.isEditingCita) {
      //   await this.citaService.update(citaData).toPromise();
      // } else {
      //   await this.citaService.save(citaData).toPromise();
      // }
      
      // Recargar datos
      await this.loadAgendas();
      this.updateCalendarEvents();
      this.closeCitaModal();
      
    } catch (error) {
      console.error('Error guardando cita:', error);
    } finally {
      this.loading = false;
    }
  }

  async guardarCita(citaData: any) {
    try {
      this.loading = true;
      
      console.log('Guardando nueva cita:', citaData);
      // Aquí integrarías con tu servicio de citas
      // await this.citaService.save(citaData).toPromise();
      
      // Recargar datos
      this.loadAgendas();
      
    } catch (error) {
      console.error('Error guardando cita:', error);
    } finally {
      this.loading = false;
    }
  }
}
