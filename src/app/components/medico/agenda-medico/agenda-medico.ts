import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgendaService } from '../../../services/agenda.service';
import { CitaService } from '../../../services/cita';
import { MedicoService } from '../../../services/medico';
import { Agenda } from '../../../models/agenda.model';
import { Cita } from '../../../models/cita.model';
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
  citas: Cita[] = [];
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
      separator: true
    },
    {
      label: 'Gestión de Horarios',
      icon: 'pi pi-clock',
      items: [
        {
          label: 'Ver Mis Horarios',
          icon: 'pi pi-list',
          command: () => this.router.navigate(['/horarios'])
        },
        {
          label: 'Agendar Horario',
          icon: 'pi pi-plus-circle',
          command: () => this.router.navigate(['/horarios'])
        },
        {
          label: 'Mi Agenda',
          icon: 'pi pi-calendar',
          command: () => this.router.navigate(['/agenda-medico'])
        }
      ]
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
    private citaService: CitaService,
    private medicoService: MedicoService,
    private calendarService: CalendarService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadAgendas();
    this.loadCitas();
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

  loadCitas(): void {
    const userId = localStorage.getItem('userId');
    
    if (userId) {
      console.log('🔍 Buscando médico con userId:', userId);
      
      // Primero obtenemos el medicoDetalle usando el userId
      this.medicoService.getMedicoByUsuario(Number(userId)).subscribe({
        next: (medico) => {
          console.log('👨‍⚕️ Médico encontrado:', medico);
          console.log('📋 ID del médico:', medico.id);
          
          // Ahora cargamos las citas usando el medicoId correcto
          this.citaService.getCitasByMedico(medico.id!).subscribe({
            next: (citas) => {
              this.citas = citas;
              console.log('✅ Citas cargadas para el médico:', citas);
              console.log('📊 Total de citas:', citas.length);
              this.updateCalendarEvents();
            },
            error: (error) => {
              console.error('❌ Error al cargar citas del médico:', error);
              this.citas = [];
            }
          });
        },
        error: (error) => {
          console.error('❌ Error al buscar médico:', error);
          console.error('Detalles del error:', error);
          this.citas = [];
        }
      });
    } else {
      console.error('❌ No se encontró userId en localStorage');
      this.citas = [];
    }
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
    return this.citas.filter(cita => {
      const fechaCita = cita.agenda?.fecha ? new Date(cita.agenda.fecha) : new Date(cita.fechaSolicitud!);
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

    return this.citas.filter(cita => {
      const fechaCita = cita.agenda?.fecha ? new Date(cita.agenda.fecha) : new Date(cita.fechaSolicitud!);
      return fechaCita >= inicioSemana && fechaCita <= finSemana;
    }).length;
  }

  getCitasProximas(): number {
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);

    const enUnaSemana = new Date(hoy);
    enUnaSemana.setDate(hoy.getDate() + 7);

    return this.citas.filter(cita => {
      const fechaCita = cita.agenda?.fecha ? new Date(cita.agenda.fecha) : new Date(cita.fechaSolicitud!);
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
    const agendaEvents = this.calendarService.convertAgendaToEvents(this.agendas);
    
    // Convertir citas a eventos de calendario
    const citaEvents: CalendarEvent[] = this.citas.map(cita => {
      const fechaInicio = cita.agenda?.fecha ? new Date(cita.agenda.fecha) : new Date(cita.fechaSolicitud!);
      const [horaInicio, minutoInicio] = cita.agenda?.horaInicio ? cita.agenda.horaInicio.split(':').map(Number) : [9, 0];
      const [horaFin, minutoFin] = cita.agenda?.horaFin ? cita.agenda.horaFin.split(':').map(Number) : [10, 0];
      
      fechaInicio.setHours(horaInicio, minutoInicio, 0, 0);
      const fechaFin = new Date(fechaInicio);
      fechaFin.setHours(horaFin, minutoFin, 0, 0);
      
      return {
        id: cita.idCita || 0,
        title: `Cita: ${cita.servicio?.nombreServicio || 'Sin servicio'}`,
        start: fechaInicio,
        end: fechaFin,
        color: '#3b82f6', // Azul para citas programadas
        type: 'cita',
        data: {
          citaId: cita.idCita,
          paciente: cita.pacienteDetalle?.usuario ? 
            `${cita.pacienteDetalle.usuario.nombre} ${cita.pacienteDetalle.usuario.apellidoPaterno}` : 
            'Paciente desconocido',
          motivo: cita.motivo || 'Sin motivo especificado',
          servicio: cita.servicio?.nombreServicio || 'Sin servicio',
          area: cita.servicio?.area?.nombreArea || 'Sin área'
        }
      };
    });
    
    // Combinar eventos de agenda y citas
    this.calendarEvents = [...agendaEvents, ...citaEvents];
    
    console.log('📅 Eventos del calendario actualizados:', {
      agendas: agendaEvents.length,
      citas: citaEvents.length,
      total: this.calendarEvents.length
    });
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

  // Navegación a horarios
  navigateToHorarios() {
    this.router.navigate(['/horarios']);
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
      this.loadAgendas();
      this.loadCitas();
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
  
  // Aceptar cita
  aceptarCita(citaId: number): void {
    if (confirm('¿Desea aceptar esta cita?')) {
      console.log('📤 Enviando petición para aceptar cita:', citaId);
      this.citaService.aceptarCita(citaId).subscribe({
        next: (response) => {
          console.log('✅ Respuesta del servidor:', response);
          alert('✅ Cita aceptada exitosamente');
          this.loadCitas();
        },
        error: (error) => {
          console.error('❌ Error al aceptar cita:', error);
          const mensaje = error?.error?.error || 'Error al aceptar la cita. Por favor intente nuevamente.';
          alert('❌ ' + mensaje);
        }
      });
    }
  }

  // Cancelar cita
  cancelarCita(citaId: number): void {
    if (confirm('¿Está seguro de que desea cancelar esta cita? Se eliminará permanentemente.')) {
      console.log('📤 Enviando petición para cancelar cita:', citaId);
      this.citaService.cancelarCita(citaId).subscribe({
        next: (response) => {
          console.log('✅ Respuesta del servidor:', response);
          alert('✅ Cita cancelada y eliminada exitosamente');
          this.loadCitas();
        },
        error: (error) => {
          console.error('❌ Error al cancelar cita:', error);
          const mensaje = error?.error?.error || 'Error al cancelar la cita. Por favor intente nuevamente.';
          alert('❌ ' + mensaje);
        }
      });
    }
  }

  // Posponer cita
  showPosponerModal = false;
  citaAPosponer: number | null = null;
  nuevaFechaPosponer = '';

  abrirModalPosponer(citaId: number): void {
    this.citaAPosponer = citaId;
    // Pre-rellenar con fecha actual
    const ahora = new Date();
    this.nuevaFechaPosponer = ahora.toISOString().slice(0, 16); // Para el input datetime-local
    this.showPosponerModal = true;
  }

  cerrarModalPosponer(): void {
    this.showPosponerModal = false;
    this.citaAPosponer = null;
    this.nuevaFechaPosponer = '';
  }

  confirmarPosponer(): void {
    if (this.citaAPosponer && this.nuevaFechaPosponer) {
      // Agregar segundos si no los tiene (formato del input datetime-local)
      let fechaCompleta = this.nuevaFechaPosponer;
      if (fechaCompleta.length === 16) {
        fechaCompleta = fechaCompleta + ':00'; // Agregar segundos
      }
      console.log('📤 Enviando petición para posponer cita:', this.citaAPosponer, 'Nueva fecha:', fechaCompleta);
      this.citaService.posponerCita(this.citaAPosponer, fechaCompleta).subscribe({
        next: (response) => {
          console.log('✅ Respuesta del servidor:', response);
          alert('✅ Cita pospuesta exitosamente');
          this.loadCitas();
          this.cerrarModalPosponer();
        },
        error: (error) => {
          console.error('❌ Error al posponer cita:', error);
          const mensaje = error?.error?.error || 'Error al posponer la cita. Por favor intente nuevamente.';
          alert('❌ ' + mensaje);
        }
      });
    } else {
      alert('Por favor seleccione una nueva fecha y hora');
    }
  }
}
