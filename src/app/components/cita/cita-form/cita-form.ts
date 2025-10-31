import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { MedicoDetalle } from '../../../models/medicoDetalle.model';
import { Servicio } from '../../../models/servicio.model';
import { Area } from '../../../models/area.model';
import { CitaService } from '../../../services/cita';
import { AgendaService } from '../../../services/agenda';
import { ServicioService } from '../../../services/servicio';
import { AreaService } from '../../../services/area';
import { AuthService } from '../../../services/auth';
import { MedicoService } from '../../../services/medico';
import { CitaDataService } from '../../../services/cita-data';
import { HorarioOcupado } from '../../../models/horarioOcupado.model';
import { PacienteService } from '../../../services/paciente';
import { CalendarService } from '../../../services/calendar.service';
import { CalendarEvent } from '../../shared/calendar/calendar.component';
import { CitaModalData } from '../../shared/cita-modal/cita-modal.component';
import { PagoModalComponent } from '../../shared/pago-modal/pago-modal.component';

interface HorarioDisponible {
  idAgenda: number;
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
}

@Component({
  selector: 'app-cita-form',
  standalone: false,
  templateUrl: './cita-form.html',
  styleUrls: ['./cita-form.css'],
  providers: [MessageService]
})

export class CitasComponent implements OnInit {

  activeModule: string = 'mis-citas';
  profileMenuItems: MenuItem[] = [];
  citaForm!: FormGroup;
  medicoSeleccionado: MedicoDetalle | null = null;
  servicioSeleccionado: Servicio | null = null;
  fechaSeleccionada: Date | null = null;
  cargandoMedico: boolean = false;
  cargandoServicio: boolean = false;
  cargandoHorarios: boolean = false;
  guardandoCita: boolean = false;
  userName: string = '';
  minDate: Date = new Date();
  maxDate: Date = new Date();
  horariosDisponibles: HorarioDisponible[] = [];
  horarioSeleccionado: HorarioDisponible | null = null;
  pacienteDetalleId: number | null = null;
  cargandoPaciente: boolean = false;
  // Nuevas propiedades para selección manual
  areasDisponibles: Area[] = [];
  serviciosDisponibles: Servicio[] = [];
  medicosDisponibles: MedicoDetalle[] = [];
  cargandoAreas: boolean = false;
  cargandoServicios: boolean = false;
  cargandoMedicos: boolean = false;
  areaSeleccionada: Area | null = null;
  servicioSeleccionadoManual: Servicio | null = null;
  medicoSeleccionadoManual: MedicoDetalle | null = null;
  
  // Propiedades para el calendario
  showCalendar: boolean = true;
  calendarEvents: CalendarEvent[] = [];
  showCitaModal: boolean = false;
  citaModalData: CitaModalData | null = null;
  currentView: 'calendar' | 'form' = 'calendar';
  
  // 🆕 Propiedades para el nuevo flujo de pago
  mostrarModalPago: boolean = false;
  citaDataTemporal: any = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private citaService: CitaService,
    private agendaService: AgendaService,
    private medicoService: MedicoService,
    private servicioService: ServicioService,
    private areaService: AreaService,
    private pacienteService: PacienteService,
    public authService: AuthService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private citaDataService: CitaDataService,
    private calendarService: CalendarService
  ) {}

  ngOnInit() {
    this.initProfileMenu();
    this.loadUserData();
    this.initForm();
    this.setDateLimits();
    this.loadSelectedData();
    this.loadPacienteDetalle();
    // Cargar áreas disponibles para selección manual
    this.loadAreasDisponibles();
    // Cargar eventos del calendario
    this.loadCalendarEvents();
  }

  initProfileMenu() {
    this.profileMenuItems = [
      {
        label: 'Acceder al perfil',
        icon: 'pi pi-user',
        command: () => this.navigateTo('/perfil')
      },
      {
        label: 'Ver histórico',
        icon: 'pi pi-history',
        command: () => this.navigateTo('/historico')
      },
      {
        separator: true
      },
      {
        label: 'Cerrar sesión',
        icon: 'pi pi-sign-out',
        command: () => this.logout()
      }
    ];
  }

  initForm() {
    this.citaForm = this.fb.group({
      idMedicoDetalle: [null, Validators.required],
      idServicio: [null, Validators.required],
      fecha: [null, Validators.required],
      idAgenda: [null, Validators.required],
      motivo: ['', [Validators.required, Validators.maxLength(255)]]
    });
  }

  loadUserData() {
    this.userName = localStorage.getItem('userName') || 'Usuario';
  }

  setDateLimits() {
    this.minDate = new Date(); // Fecha mínima: hoy
    this.maxDate = new Date();
    this.maxDate.setMonth(this.maxDate.getMonth() + 3); // Fecha máxima: 3 meses desde hoy
  }

  // En cita-form.component.ts - modifica loadSelectedData
  loadSelectedData() {
    this.route.queryParams.subscribe(params => {
      const idMedico = +params['medicoId'];
      const idServicio = +params['servicioId'];
      const userId = params['userId']; // Obtener userId de queryParams

      console.log('Params recibidos:', { idMedico, idServicio, userId });

      // Si viene userId en queryParams, actualizar localStorage
      if (userId) {
        localStorage.setItem('userId', userId);
        console.log('UserId actualizado desde queryParams:', userId);
      }

      // Intentar obtener de localStorage si no vienen en params
      const medicoStorage = localStorage.getItem('medicoSeleccionado');
      const servicioStorage = localStorage.getItem('servicioSeleccionado');
      const userIdStorage = localStorage.getItem('userId');

      console.log('Datos de localStorage:', {
        medicoStorage: medicoStorage ? JSON.parse(medicoStorage) : null,
        servicioStorage: servicioStorage ? JSON.parse(servicioStorage) : null,
        userIdStorage: userIdStorage
      });

      const finalMedicoId = idMedico || (medicoStorage ? JSON.parse(medicoStorage).idMedicoDetalle : null);
      const finalServicioId = idServicio || (servicioStorage ? JSON.parse(servicioStorage).idServicio : null);

      if (!finalMedicoId || !finalServicioId) {
        this.messageService.add({
          severity: 'info',
          summary: 'Selecciona tus preferencias',
          detail: 'Por favor selecciona un área médica, servicio y médico para continuar'
        });
        // No redirigir automáticamente, permitir que el usuario seleccione desde el formulario
        return;
      }

      // Actualizar formulario
      this.citaForm.patchValue({
        idMedicoDetalle: finalMedicoId,
        idServicio: finalServicioId
      });

      // Cargar detalles
      this.loadMedicoDetalle(finalMedicoId);
      this.loadServicioDetalle(finalServicioId);
    });
  }

  loadPacienteDetalle() {
    this.cargandoPaciente = true;
  
    // Obtener el ID de usuario del localStorage
    const usuarioId = localStorage.getItem('userId');
  
    console.log('Buscando paciente detalle para userId:', usuarioId);
  
    if (!usuarioId) {
      console.error('No se encontró userId en localStorage');
      this.cargandoPaciente = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.'
      });
      return;
    }

    this.pacienteService.getPacienteDetalleByUsuarioId(parseInt(usuarioId)).subscribe({
      next: (pacienteDetalle) => {
        console.log('Paciente detalle cargado y mapeado:', pacienteDetalle);
      
        // Usar el ID que viene del backend (que está en la propiedad 'id')
        if (pacienteDetalle && pacienteDetalle.id) {
          this.pacienteDetalleId = pacienteDetalle.id;
        
          // Guardar en localStorage para futuras referencias
          localStorage.setItem('pacienteDetalleId', this.pacienteDetalleId.toString());
          console.log('PacienteDetalleId guardado en localStorage:', this.pacienteDetalleId);
        } else {
          console.error('Paciente detalle no tiene ID válido:', pacienteDetalle);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo obtener la información del paciente.'
          });
        }
      
        this.cargandoPaciente = false;
      },
      error: (error) => {
        console.error('Error al cargar paciente detalle:', error);
        this.cargandoPaciente = false;
      
        // Intentar obtener de localStorage como fallback
        const pacienteIdFromStorage = localStorage.getItem('pacienteDetalleId');
        if (pacienteIdFromStorage) {
          this.pacienteDetalleId = parseInt(pacienteIdFromStorage);
          console.log('Usando paciente detalle ID de localStorage (fallback):', this.pacienteDetalleId);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar la información del paciente. Por favor, contacta al administrador.'
          });
          console.error('No se pudo obtener el pacienteDetalleId de ninguna fuente');
        }
      }
    });
  }

  loadAreasDisponibles() {
    this.cargandoAreas = true;
    this.areaService.getAreas().subscribe({
      next: (areas: Area[]) => {
        this.areasDisponibles = areas;
        this.cargandoAreas = false;
      },
      error: (error: any) => {
        console.error('Error cargando áreas:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las áreas médicas'
        });
        this.cargandoAreas = false;
      }
    });
  }

  loadMedicoDetalle(idMedico: number) {
    this.cargandoMedico = true;
  
    this.medicoService.getMedicoById(idMedico).subscribe({
      next: (medico) => {
        this.medicoSeleccionado = medico;
        this.cargandoMedico = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar médico:', error);
        this.cargandoMedico = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la información del médico'
        });
      }
    });
  }
  
  loadServicioDetalle(idServicio: number) {
    this.cargandoServicio = true;
    
    this.servicioService.getServicioById(idServicio).subscribe({
      next: (servicio) => {
        this.servicioSeleccionado = servicio;
        this.cargandoServicio = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar servicio:', error);
        this.cargandoServicio = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la información del servicio'
        });
      }
    });
  }

  // Funciones para selección manual
  onAreaSeleccionada(area: Area) {
    this.areaSeleccionada = area;
    this.servicioSeleccionadoManual = null;
    this.medicoSeleccionadoManual = null;
    this.serviciosDisponibles = [];
    this.medicosDisponibles = [];
    this.loadServiciosPorArea(area.id!);
  }

  onServicioSeleccionado(servicio: Servicio) {
    this.servicioSeleccionadoManual = servicio;
    this.medicoSeleccionadoManual = null;
    this.medicosDisponibles = [];
    this.loadMedicosPorServicio(servicio.id!);
  }

  onMedicoSeleccionado(medico: MedicoDetalle) {
    this.medicoSeleccionadoManual = medico;
    this.medicoSeleccionado = medico;
    this.servicioSeleccionado = this.servicioSeleccionadoManual;
    
    // Actualizar el formulario
    this.citaForm.patchValue({
      idMedicoDetalle: medico.id,
      idServicio: this.servicioSeleccionadoManual?.id
    });
  }

  loadServiciosPorArea(areaId: number) {
    this.cargandoServicios = true;
    this.servicioService.getServiciosByArea(areaId).subscribe({
      next: (servicios: Servicio[]) => {
        this.serviciosDisponibles = servicios;
        this.cargandoServicios = false;
      },
      error: (error: any) => {
        console.error('Error cargando servicios:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los servicios'
        });
        this.cargandoServicios = false;
      }
    });
  }

  loadMedicosPorServicio(servicioId: number) {
    this.cargandoMedicos = true;
    this.medicoService.getMedicosByServicio(servicioId).subscribe({
      next: (medicos: MedicoDetalle[]) => {
        this.medicosDisponibles = medicos;
        this.cargandoMedicos = false;
      },
      error: (error: any) => {
        console.error('Error cargando médicos:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los médicos'
        });
        this.cargandoMedicos = false;
      }
    });
  }

  onFechaChange(event: any) {
    this.fechaSeleccionada = event;
    this.citaForm.patchValue({ idAgenda: null });
    
    if (this.fechaSeleccionada && this.medicoSeleccionado?.id) {
      this.loadHorariosDisponibles();
    }
  }

  loadHorariosDisponibles() {
    if (!this.fechaSeleccionada || !this.medicoSeleccionado?.id) return;

    this.cargandoHorarios = true;
    this.horariosDisponibles = [];

    // Primero generamos TODOS los horarios posibles como DISPONIBLES
    this.generarHorariosFijos();

    // Luego cargamos los horarios OCUPADOS del backend y marcamos esos como no disponibles
    const fechaStr = this.formatDateForQuery(this.fechaSeleccionada);

    this.agendaService.getHorariosOcupados(this.medicoSeleccionado.id, fechaStr).subscribe({
      next: (horariosOcupadosBackend: HorarioOcupado[] | null) => {
        console.log('Horarios OCUPADOS del backend:', horariosOcupadosBackend);
      
        // MANEJO DEL CASO NULL: Si es null, usar array vacío
        const horariosOcupados = horariosOcupadosBackend || [];
      
        // Normalizamos los horarios ocupados del backend (quitamos segundos)
        const horariosOcupadosNormalizados = horariosOcupados.map(ocupado => ({
          ...ocupado,
          horaInicio: this.normalizarHora(ocupado.horaInicio),
          horaFin: this.normalizarHora(ocupado.horaFin)
        }));

        console.log('Horarios ocupados normalizados:', horariosOcupadosNormalizados);

        // Marcamos como OCUPADOS los horarios que se SOLAPAN con horarios ocupados
        this.horariosDisponibles = this.horariosDisponibles.map(horario => {
          const estaOcupado = horariosOcupadosNormalizados.some(ocupado => 
            this.horariosSeSolapan(horario, ocupado)
          );
          return {
            ...horario,
            disponible: !estaOcupado
          };
        });

        this.cargandoHorarios = false;
        this.cdr.detectChanges();

        console.log('Horarios finales con disponibilidad:', this.horariosDisponibles);

        // Contar horarios disponibles
        const horariosDisponiblesCount = this.horariosDisponibles.filter(h => h.disponible).length;
    
        if (horariosDisponiblesCount === 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'Sin horarios disponibles',
            detail: 'No hay horarios disponibles para esta fecha'
          });
        } else {
          this.messageService.add({
            severity: 'success',
            summary: 'Horarios cargados',
            detail: `${horariosDisponiblesCount} horarios disponibles`,
            life: 3000
          });
        }
      },
      error: (error) => {
        console.error('Error al cargar horarios ocupados:', error);
      
        // En caso de error, mantener todos los horarios como disponibles
        this.cargandoHorarios = false;
      
        // Mostrar mensaje informativo
        if (error.status === 404) {
        
          // 404 significa que no hay citas para esa fecha (lo cual es normal)
          console.log('No se encontraron citas para esta fecha - todos los horarios están disponibles');
          this.messageService.add({
            severity: 'success',
            summary: 'Horarios disponibles',
            detail: 'Todos los horarios están disponibles para esta fecha',
            life: 3000
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los horarios disponibles'
          });
        }
      }
    });
  }

  // Método para verificar si dos horarios se solapan
  private horariosSeSolapan(horario1: { horaInicio: string, horaFin: string }, horario2: { horaInicio: string, horaFin: string }): boolean {
    // Convertimos las horas a minutos para facilitar la comparación
    const inicio1 = this.horaAMinutos(horario1.horaInicio);
    const fin1 = this.horaAMinutos(horario1.horaFin);
    const inicio2 = this.horaAMinutos(horario2.horaInicio);
    const fin2 = this.horaAMinutos(horario2.horaFin);

    // Dos horarios se solapan si:
    // - El inicio del primero está dentro del segundo, O
    // - El fin del primero está dentro del segundo, O  
    // - El primero contiene completamente al segundo
    return (inicio1 >= inicio2 && inicio1 < fin2) ||  // inicio1 dentro de horario2
           (fin1 > inicio2 && fin1 <= fin2) ||        // fin1 dentro de horario2
           (inicio1 <= inicio2 && fin1 >= fin2);      // horario1 contiene horario2
  }

  // Método auxiliar para convertir hora string a minutos
  private horaAMinutos(hora: string): number {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  }

  private normalizarHora(hora: string): string {
    // Si la hora viene en formato HH:mm:ss, la convertimos a HH:mm
    if (hora.length === 8) { // formato "14:00:00"
      return hora.substring(0, 5); // queda "14:00"
    }
    return hora; // ya está en formato HH:mm
  }

  generarHorariosFijos() {
    const horarios: HorarioDisponible[] = [];
    let idCounter = 1;
  
    // Generar horarios cada hora desde las 8:00 hasta las 17:00 (5:00 PM)
    for (let hora = 8; hora < 18; hora++) {
      const horaInicio = `${hora.toString().padStart(2, '0')}:00`;
      const horaFin = `${(hora + 1).toString().padStart(2, '0')}:00`;
    
      horarios.push({
        idAgenda: idCounter++,
        horaInicio: horaInicio,
        horaFin: horaFin,
        disponible: true // Inicialmente todos disponibles
      });
    }

    this.horariosDisponibles = horarios;
    console.log('Horarios base generados:', this.horariosDisponibles);
  }

  seleccionarHorario(horario: HorarioDisponible) {
    if (!horario.disponible) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Horario ocupado',
        detail: 'Este horario ya está reservado'
      });
      return;
    }

    this.horarioSeleccionado = horario;
    this.citaForm.patchValue({ idAgenda: horario.idAgenda });
  }

  onSubmit() {
    if (this.citaForm.invalid || !this.horarioSeleccionado || !this.fechaSeleccionada) {
      this.markFormGroupTouched(this.citaForm);
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'Por favor completa todos los campos requeridos'
      });
      return;
    }

    if (!this.pacienteDetalleId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo identificar al paciente. Por favor, intenta nuevamente.'
      });
      return;
    }

    // 🆕 NUEVO FLUJO: En lugar de crear la cita directamente,
    // preparamos los datos y abrimos el modal de pago
    this.prepararYMostrarPago();
  }

  /**
   * 🆕 Prepara los datos de la cita y abre el modal de pago
   */
  prepararYMostrarPago() {
    // Construir fecha y hora
    const fechaHora = this.construirFechaHora();
    
    // Preparar datos de la cita (sin crear todavía)
    this.citaDataTemporal = {
      pacienteId: this.pacienteDetalleId,
      medicoId: this.citaForm.value.idMedicoDetalle,
      servicioId: this.citaForm.value.idServicio,
      fechaHora: fechaHora.toISOString(),
      motivo: this.citaForm.value.motivo
    };
    
    console.log('📋 Datos de cita preparados:', this.citaDataTemporal);
    console.log('💰 Costo del servicio:', this.servicioSeleccionado?.costo);
    
    // Abrir el modal de pago
    this.mostrarModalPago = true;
  }

  /**
   * 🆕 Construye la fecha y hora de la cita
   */
  construirFechaHora(): Date {
    if (!this.fechaSeleccionada || !this.horarioSeleccionado) {
      throw new Error('Fecha u horario no seleccionado');
    }
    
    const fecha = new Date(this.fechaSeleccionada);
    const [hour, minute] = this.horarioSeleccionado.horaInicio.split(':').map(Number);
    fecha.setHours(hour, minute, 0, 0);
    
    return fecha;
  }

  /**
   * 🆕 Se ejecuta cuando el pago es exitoso
   */
  onPagoExitoso(datosPago: any) {
    console.log('✅ Pago exitoso recibido:', datosPago);
    
    this.mostrarModalPago = false;
    this.guardandoCita = true;
    
    // Ahora SÍ creamos la cita con el pago ya procesado
    this.citaService.crearCitaConPago(this.citaDataTemporal, datosPago).subscribe({
      next: (response: any) => {
        this.guardandoCita = false;
        
        console.log('✅ Respuesta del servidor:', response);
        
        this.messageService.add({
          severity: 'success',
          summary: '¡Cita agendada!',
          detail: `Pago procesado exitosamente. Referencia: ${response.pago.referencia}`,
          life: 5000
        });
        
        // Limpiar datos guardados
        this.citaDataService.limpiarSeleccion();
        this.horarioSeleccionado = null;
        this.citaDataTemporal = null;
        
        // Redirigir a mis citas después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/mis-citas']);
        }, 2000);
      },
      error: (error: any) => {
        console.error('❌ Error al crear cita con pago:', error);
        this.guardandoCita = false;
        
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.error || 'No se pudo procesar el pago. Intenta nuevamente.'
        });
        
        // Reabrir el modal de pago para que el usuario pueda reintentar
        this.mostrarModalPago = true;
      }
    });
  }

  /**
   * 🆕 Se ejecuta cuando el usuario cierra el modal de pago
   */
  onCerrarModalPago() {
    this.mostrarModalPago = false;
    this.citaDataTemporal = null;
    
    this.messageService.add({
      severity: 'info',
      summary: 'Pago cancelado',
      detail: 'No se ha creado la cita. Puedes intentarlo nuevamente cuando quieras.'
    });
  }

  private formatDateForBackend(date: Date): string {
  // Asegurarnos de que la fecha sea válida
    if (!date || isNaN(date.getTime())) {
      console.error('Fecha inválida:', date);
      throw new Error('Fecha inválida');
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private obtenerPacienteDetalleId(): number {
    const pacienteId = localStorage.getItem('pacienteDetalleId');
    return pacienteId ? parseInt(pacienteId) : 0;
  }

  private formatDateForQuery(date: Date): string {
    return this.formatDateForBackend(date);
  }


  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.citaForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getNombreCompletoMedico(): string {
    if (!this.medicoSeleccionado?.usuario) return 'Médico';
    const usuario = this.medicoSeleccionado.usuario;
    return `Dr. ${usuario.nombre} ${usuario.apellidoPaterno} ${usuario.apellidoMaterno || ''}`.trim();
  }

  getIniciales(): string {
    if (!this.medicoSeleccionado?.usuario) return 'Dr';
    const nombre = this.medicoSeleccionado.usuario.nombre?.charAt(0) || '';
    const apellido = this.medicoSeleccionado.usuario.apellidoPaterno?.charAt(0) || '';
    return (nombre + apellido).toUpperCase() || 'Dr';
  }

  formatTimeRange(horaInicio: string, horaFin: string): string {
    return `${this.formatTime(horaInicio)} - ${this.formatTime(horaFin)}`;
  }

  formatTime(time: string): string {
    const timeParts = time.split(':');
    const hours = timeParts[0];
    const minutes = timeParts[1];
  
    // Convertir formato 24h a 12h
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
  
    return `${hour12}:${minutes} ${ampm}`;
  }

  getDuracionFormateada(): string {
    if (!this.servicioSeleccionado?.duracion) return 'No especificada';
    const minutos = this.servicioSeleccionado.duracion;
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
  }

  getPrecioFormateado(): string {
    if (!this.servicioSeleccionado?.costo) return 'Consultar';
    return `$${this.servicioSeleccionado.costo.toFixed(2)} MXN`;
  }

  cancelar() {
    localStorage.removeItem('medicoSeleccionado');
    localStorage.removeItem('servicioSeleccionado');
    this.router.navigate(['/areas']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  selectModule(module: string) {
    this.activeModule = module;
    this.router.navigate([`/${module}`]);
  }

  // Funciones auxiliares para la selección manual
  getDuracionFormateadaServicio(servicio: Servicio): string {
    if (!servicio.duracion) return 'Duración no especificada';
    const horas = Math.floor(servicio.duracion / 60);
    const minutos = servicio.duracion % 60;
    if (horas > 0) {
      return minutos > 0 ? `${horas}h ${minutos}min` : `${horas}h`;
    }
    return `${minutos}min`;
  }

  getInicialesMedico(medico: MedicoDetalle): string {
    if (!medico?.usuario) return 'Dr';
    const nombre = medico.usuario.nombre?.charAt(0) || '';
    const apellido = medico.usuario.apellidoPaterno?.charAt(0) || '';
    return (nombre + apellido).toUpperCase() || 'Dr';
  }

  getNombreCompletoMedicoManual(medico: MedicoDetalle): string {
    if (!medico?.usuario) return 'Médico';
    const usuario = medico.usuario;
    return `Dr. ${usuario.nombre} ${usuario.apellidoPaterno} ${usuario.apellidoMaterno || ''}`.trim();
  }

  getCedulaMedicoManual(medico: MedicoDetalle): string {
    return medico.cedulaProfecional || 'Cédula no disponible';
  }

  // Métodos para el calendario
  switchView(view: 'calendar' | 'form') {
    this.currentView = view;
  }

  onDateClick(date: Date) {
    console.log('Fecha seleccionada:', date);
    const userId = localStorage.getItem('userId');
    this.citaModalData = {
      fecha: date,
      hora: 9, // Hora por defecto
      pacienteId: userId ? +userId : undefined
    };
    this.showCitaModal = true;
  }

  onEventClick(event: CalendarEvent) {
    console.log('Evento clickeado:', event);
    if (event.data && event.data.cita) {
      this.router.navigate(['/cita-list']);
    }
  }

  onModalClose() {
    this.showCitaModal = false;
    this.citaModalData = null;
  }

  onCitaCreated(citaData: any) {
    console.log('Cita creada:', citaData);
    this.showCitaModal = false;
    this.citaModalData = null;
    
    // Recargar eventos del calendario
    this.loadCalendarEvents();
    
    this.messageService.add({
      severity: 'success',
      summary: 'Cita Creada',
      detail: 'La cita ha sido agendada exitosamente'
    });
  }

  loadCalendarEvents() {
    const userIdStr = localStorage.getItem('userId');
    if (!userIdStr) return;
    const userId = +userIdStr;

    this.citaService.getCitasProximas(userId).subscribe({
      next: (citas) => {
        this.calendarEvents = citas.map(cita => ({
          id: cita.idCita,
          title: cita.servicio?.nombreServicio || 'Cita Médica',
          start: new Date(cita.agenda?.fecha || cita.fechaSolicitud),
          end: new Date(cita.agenda?.fecha || cita.fechaSolicitud),
          color: this.getEventColor(cita.estatus?.nombre),
          type: 'cita' as const,
          data: { cita }
        }));
      },
      error: (error) => {
        console.error('Error cargando eventos:', error);
      }
    });
  }

  getEventColor(status?: string): string {
    switch (status?.toLowerCase()) {
      case 'pendiente': return '#f59e0b';
      case 'confirmada': return '#3b82f6';
      case 'completada': return '#10b981';
      case 'cancelada': return '#ef4444';
      default: return '#6b7280';
    }
  }

  abrirModalNuevaCita() {
    const userId = localStorage.getItem('userId');
    this.citaModalData = {
      fecha: new Date(),
      hora: 9,
      pacienteId: userId ? +userId : undefined
    };
    this.showCitaModal = true;
  }
}