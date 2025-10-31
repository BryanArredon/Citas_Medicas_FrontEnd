import { Component, Input, Output, EventEmitter, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CalendarEvent } from '../calendar/calendar.component';
import { AreaService } from '../../../services/area';
import { ServicioService } from '../../../services/servicio';
import { MedicoService } from '../../../services/medico';
import { AgendaService } from '../../../services/agenda.service';
import { CitaService } from '../../../services/cita';
import { AuthService } from '../../../services/auth';
import { PacienteService } from '../../../services/paciente';
import { MessageService } from 'primeng/api';
import { Area } from '../../../models/area.model';
import { Servicio } from '../../../models/servicio.model';
import { MedicoDetalle } from '../../../models/medicoDetalle.model';
import { Agenda } from '../../../models/agenda.model';

export interface CitaModalData {
  fecha: Date;
  hora: number;
  medicoId?: number;
  pacienteId?: number;
  servicioId?: number;
  areaId?: number;
}

@Component({
  selector: 'app-cita-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div *ngIf="visible" class="fixed inset-0 z-50 flex items-center justify-center">
      <!-- Backdrop -->
      <div 
        class="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        (click)="closeModal()">
      </div>
      
      <!-- Modal -->
      <div class="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-teal-600 text-white p-6 rounded-t-2xl">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold">{{ isEditing ? 'Editar Cita' : 'Nueva Cita' }}</h2>
              <p class="text-blue-100 text-sm">{{ getModalSubtitle() }}</p>
            </div>
            <button 
              (click)="closeModal()"
              class="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <i class="pi pi-times text-xl"></i>
            </button>
          </div>
        </div>

        <!-- Content -->
        <form [formGroup]="citaForm" (ngSubmit)="onSubmit()" class="p-6">
          <div class="space-y-6">
            <!-- Información de Fecha y Hora -->
            <div class="bg-blue-50 rounded-xl p-4">
              <h3 class="font-semibold text-gray-800 mb-3 flex items-center">
                <i class="pi pi-calendar mr-2 text-blue-600"></i>
                Fecha y Hora
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                  <input
                    type="date"
                    formControlName="fecha"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <div *ngIf="citaForm.get('fecha')?.invalid && citaForm.get('fecha')?.touched" 
                       class="text-red-500 text-xs mt-1">
                    La fecha es requerida
                  </div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Hora</label>
                  <select
                    formControlName="hora"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Seleccionar hora</option>
                    <option *ngFor="let slot of availableTimeSlots" [value]="slot.value">
                      {{ slot.label }}
                    </option>
                  </select>
                  <div *ngIf="citaForm.get('hora')?.invalid && citaForm.get('hora')?.touched" 
                       class="text-red-500 text-xs mt-1">
                    La hora es requerida
                  </div>
                </div>
              </div>
            </div>

            <!-- Información del Paciente -->
            <div>
              <h3 class="font-semibold text-gray-800 mb-3 flex items-center">
                <i class="pi pi-user mr-2 text-blue-600"></i>
                Información del Paciente
              </h3>
              
              <div *ngIf="cargandoPaciente" class="flex items-center justify-center p-6">
                <i class="pi pi-spin pi-spinner text-2xl text-blue-600 mr-3"></i>
                <span class="text-gray-600">Cargando información del paciente...</span>
              </div>
              
              <div *ngIf="!cargandoPaciente && pacienteSeleccionado" 
                   class="p-4 bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-xl">
                <div class="flex items-start">
                  <div class="bg-blue-500 text-white rounded-full p-3 mr-4">
                    <i class="pi pi-user text-xl"></i>
                  </div>
                  <div class="flex-1">
                    <div class="font-bold text-lg text-gray-800">
                      {{ pacienteSeleccionado.usuario?.nombre }} {{ pacienteSeleccionado.usuario?.apellidoPaterno }}
                    </div>
                    <div class="text-sm text-gray-600 mt-1">
                      <i class="pi pi-envelope mr-2"></i>{{ pacienteSeleccionado.usuario?.correoElectronico }}
                    </div>
                    <div class="text-sm text-gray-600 mt-1" *ngIf="pacienteSeleccionado.usuario?.telefono">
                      <i class="pi pi-phone mr-2"></i>{{ pacienteSeleccionado.usuario?.telefono }}
                    </div>
                    <div class="mt-2 pt-2 border-t border-blue-200">
                      <div class="text-xs text-gray-500" *ngIf="pacienteSeleccionado.tipoSangre">
                        <strong>Tipo de Sangre:</strong> {{ pacienteSeleccionado.tipoSangre }}
                      </div>
                      <div class="text-xs text-gray-500 mt-1" *ngIf="pacienteSeleccionado.alergias">
                        <strong>Alergias:</strong> {{ pacienteSeleccionado.alergias }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div *ngIf="!cargandoPaciente && !pacienteSeleccionado" 
                   class="p-4 border-2 border-dashed border-red-300 rounded-lg text-center text-red-600 bg-red-50">
                <i class="pi pi-exclamation-triangle text-2xl mb-2"></i>
                <div class="font-medium">No se pudo cargar la información del paciente</div>
                <div class="text-sm">Por favor, inicie sesión nuevamente</div>
              </div>
            </div>

            <!-- Información del Área, Servicio, Médico y Horario -->
            <div>
              <h3 class="font-semibold text-gray-800 mb-4 flex items-center">
                <i class="pi pi-building mr-2 text-blue-600"></i>
                Información del Servicio Médico
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Área -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Área Médica <span class="text-red-500">*</span>
                  </label>
                  <select
                    formControlName="areaId"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    [disabled]="cargandoAreas">
                    <option value="">
                      {{ cargandoAreas ? 'Cargando áreas...' : 'Seleccionar área médica' }}
                    </option>
                    <option *ngFor="let area of areasDisponibles" [value]="area.id">
                      {{ area.nombreArea }}
                    </option>
                  </select>
                  <div *ngIf="citaForm.get('areaId')?.invalid && citaForm.get('areaId')?.touched" 
                       class="text-red-500 text-xs mt-1">
                    El área es requerida
                  </div>
                </div>

                <!-- Servicio -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Servicio <span class="text-red-500">*</span>
                  </label>
                  <select
                    formControlName="servicioId"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    [disabled]="!citaForm.get('areaId')?.value || cargandoServicios">
                    <option value="">
                      {{ !citaForm.get('areaId')?.value ? 'Primero seleccione un área' : 
                         cargandoServicios ? 'Cargando servicios...' : 'Seleccionar servicio' }}
                    </option>
                    <option *ngFor="let servicio of serviciosDisponibles" [value]="servicio.id">
                      {{ servicio.nombreServicio }}
                    </option>
                  </select>
                  <div *ngIf="citaForm.get('servicioId')?.invalid && citaForm.get('servicioId')?.touched" 
                       class="text-red-500 text-xs mt-1">
                    El servicio es requerido
                  </div>
                </div>

                <!-- Médico -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Médico <span class="text-red-500">*</span>
                  </label>
                  <select
                    formControlName="medicoId"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    [disabled]="!citaForm.get('servicioId')?.value || cargandoMedicos">
                    <option value="">
                      {{ !citaForm.get('servicioId')?.value ? 'Primero seleccione un servicio' : 
                         cargandoMedicos ? 'Cargando médicos...' : 'Seleccionar médico' }}
                    </option>
                    <option *ngFor="let medico of medicosDisponibles" [value]="medico.id">
                      Dr. {{ medico.usuario?.nombre }} {{ medico.usuario?.apellidoPaterno }}
                    </option>
                  </select>
                  <div *ngIf="citaForm.get('medicoId')?.invalid && citaForm.get('medicoId')?.touched" 
                       class="text-red-500 text-xs mt-1">
                    El médico es requerido
                  </div>
                </div>

                <!-- Horario -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Horario Disponible <span class="text-gray-400">(Opcional)</span>
                  </label>
                  <select
                    formControlName="agendaId"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    [disabled]="!citaForm.get('medicoId')?.value || !citaForm.get('fecha')?.value || cargandoHorarios">
                    <option value="">
                      {{ !citaForm.get('medicoId')?.value || !citaForm.get('fecha')?.value ? 
                         'Seleccione médico y fecha primero' : 
                         cargandoHorarios ? 'Cargando horarios...' : 
                         horariosDisponibles.length === 0 ? 'Sin horarios configurados (Opcional)' : 'Seleccionar horario' }}
                    </option>
                    <option *ngFor="let horario of horariosDisponibles" [value]="horario.id || horario.idAgenda">
                      {{ horario.fecha?.split('T')[0] || 'Sin fecha' }} - {{ horario.horaInicio }} a {{ horario.horaFin }}
                    </option>
                  </select>
                  <div *ngIf="horariosDisponibles.length === 0 && citaForm.get('medicoId')?.value && citaForm.get('fecha')?.value && !cargandoHorarios" 
                       class="text-amber-600 text-xs mt-1 flex items-center">
                    <i class="pi pi-info-circle mr-1"></i>
                    El médico no tiene horarios configurados. Puede continuar sin seleccionar horario.
                  </div>
                </div>
              </div>
            </div>

            <!-- Motivo de la Cita -->
            <div>
              <h3 class="font-semibold text-gray-800 mb-3 flex items-center">
                <i class="pi pi-file-edit mr-2 text-blue-600"></i>
                Motivo de la Cita <span class="text-red-500">*</span>
              </h3>
              
              <textarea
                formControlName="motivo"
                rows="3"
                placeholder="Describa el motivo de la cita médica..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none">
              </textarea>
              <div *ngIf="citaForm.get('motivo')?.invalid && citaForm.get('motivo')?.touched" 
                   class="text-red-500 text-xs mt-1">
                El motivo es requerido
              </div>
            </div>

            <!-- Notas adicionales -->
            <div>
              <h3 class="font-semibold text-gray-800 mb-3 flex items-center">
                <i class="pi pi-file-edit mr-2 text-blue-600"></i>
                Notas Adicionales
              </h3>
              
              <textarea
                formControlName="notas"
                rows="3"
                placeholder="Notas o comentarios adicionales..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none">
              </textarea>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              (click)="closeModal()"
              class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
              Cancelar
            </button>
            
            <button
              type="submit"
              [disabled]="citaForm.invalid || loading"
              class="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
              <span *ngIf="loading" class="inline-flex items-center">
                <i class="pi pi-spin pi-spinner mr-2"></i>
                Guardando...
              </span>
              <span *ngIf="!loading">
                {{ isEditing ? 'Actualizar Cita' : 'Crear Cita' }}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class CitaModalComponent implements OnInit {
  @Input() visible = false;
  @Input() citaData: CitaModalData | null = null;
  @Input() editingEvent: CalendarEvent | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  citaForm: FormGroup;
  loading = false;
  isEditing = false;

  // Datos para los dropdowns
  areasDisponibles: Area[] = [];
  serviciosDisponibles: Servicio[] = [];
  medicosDisponibles: MedicoDetalle[] = [];
  horariosDisponibles: any[] = [];
  availableTimeSlots: { value: string, label: string }[] = [];

  // Paciente logueado
  pacienteSeleccionado: any = null;
  usuarioLogueadoId: number | null = null;

  // Estados de carga
  cargandoAreas = false;
  cargandoServicios = false;
  cargandoMedicos = false;
  cargandoHorarios = false;
  cargandoPaciente = false;

  constructor(
    private fb: FormBuilder,
    private areaService: AreaService,
    private servicioService: ServicioService,
    private medicoService: MedicoService,
    private agendaService: AgendaService,
    private citaService: CitaService,
    private messageService: MessageService,
    private authService: AuthService,
    private pacienteService: PacienteService
  ) {
    this.citaForm = this.fb.group({
      fecha: ['', Validators.required],
      hora: [''],
      areaId: ['', Validators.required],
      servicioId: ['', Validators.required],
      medicoId: ['', Validators.required],
      agendaId: [''], // Opcional - si no hay agendas configuradas
      motivo: ['', Validators.required],
      notas: ['']
    });
  }

  ngOnInit() {
    this.generateTimeSlots();
    this.loadInitialData();
    
    if (this.editingEvent) {
      this.isEditing = true;
      this.loadEventData();
    } else if (this.citaData) {
      this.loadCitaData();
    }
  }

  loadInitialData() {
    // Cargar paciente logueado
    this.loadPacienteLogueado();
    
    // Cargar áreas disponibles
    this.loadAreas();
    
    // Configurar listeners para cambios en el formulario
    this.setupFormListeners();
  }

  loadAreas() {
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

  setupFormListeners() {
    // Cuando cambia el área, cargar servicios
    this.citaForm.get('areaId')?.valueChanges.subscribe(areaId => {
      if (areaId) {
        this.loadServiciosPorArea(areaId);
        // Limpiar selecciones dependientes
        this.citaForm.patchValue({
          servicioId: '',
          medicoId: '',
          agendaId: ''
        });
        this.medicosDisponibles = [];
        this.horariosDisponibles = [];
      }
    });

    // Cuando cambia el servicio, cargar médicos
    this.citaForm.get('servicioId')?.valueChanges.subscribe(servicioId => {
      if (servicioId) {
        this.loadMedicosPorServicio(servicioId);
        // Limpiar selecciones dependientes
        this.citaForm.patchValue({
          medicoId: '',
          agendaId: ''
        });
        this.horariosDisponibles = [];
      }
    });

    // Cuando cambia el médico o la fecha, cargar horarios
    this.citaForm.get('medicoId')?.valueChanges.subscribe(() => {
      this.loadHorariosDisponibles();
    });

    this.citaForm.get('fecha')?.valueChanges.subscribe(() => {
      this.loadHorariosDisponibles();
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
    
    // Intenta cargar médicos por servicio, pero si no hay resultados, carga todos
    this.medicoService.getMedicosByServicio(servicioId).subscribe({
      next: (medicos: MedicoDetalle[]) => {
        if (medicos.length === 0) {
          // Si no hay médicos con ese servicio asignado, cargar todos los médicos
          console.warn('No hay médicos asignados a este servicio, cargando todos los médicos disponibles');
          this.loadTodosMedicos();
        } else {
          this.medicosDisponibles = medicos;
          this.cargandoMedicos = false;
        }
      },
      error: (error: any) => {
        console.error('Error cargando médicos por servicio:', error);
        // Si falla, intentar cargar todos los médicos
        this.loadTodosMedicos();
      }
    });
  }

  loadTodosMedicos() {
    this.medicoService.getAllMedicos().subscribe({
      next: (medicos: MedicoDetalle[]) => {
        // Filtrar solo médicos que tienen rol MEDICO
        this.medicosDisponibles = medicos.filter(m => 
          m.usuario?.rolUser?.nombreRol === 'MEDICO'
        );
        this.cargandoMedicos = false;
        
        if (this.medicosDisponibles.length === 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'Sin médicos',
            detail: 'No hay médicos disponibles en el sistema'
          });
        }
      },
      error: (error: any) => {
        console.error('Error cargando todos los médicos:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los médicos'
        });
        this.cargandoMedicos = false;
      }
    });
  }

  loadHorariosDisponibles() {
    const medicoId = this.citaForm.get('medicoId')?.value;
    const fecha = this.citaForm.get('fecha')?.value;

    if (!medicoId || !fecha) {
      this.horariosDisponibles = [];
      return;
    }

    this.cargandoHorarios = true;
    // Obtener agendas del médico y filtrar por fecha
    this.agendaService.getAgendasByMedico(medicoId).subscribe({
      next: (agendas: Agenda[]) => {
        console.log('Agendas del médico:', agendas);
        
        if (agendas.length === 0) {
          this.horariosDisponibles = [];
          this.messageService.add({
            severity: 'warn',
            summary: 'Sin agendas',
            detail: 'El médico seleccionado no tiene agendas configuradas. Por favor, contacte al administrador.'
          });
          this.cargandoHorarios = false;
          return;
        }
        
        // Mostrar TODAS las agendas del médico (sin filtrar por fecha)
        console.log('� Total de agendas del médico:', agendas.length);
        agendas.forEach((a, index) => {
          console.log(`  ${index + 1}. ID: ${a.id}, Fecha: ${a.fecha.split('T')[0]}, Horario: ${a.horaInicio} - ${a.horaFin}`);
        });
        
        // Mostrar todas las agendas sin filtrar por fecha
        this.horariosDisponibles = agendas;
        
        console.log('✅ Horarios disponibles:', this.horariosDisponibles.length);
        
        if (this.horariosDisponibles.length === 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'Sin horarios',
            detail: 'No hay horarios disponibles para esta fecha. Intente con otra fecha.'
          });
        }
        
        this.cargandoHorarios = false;
      },
      error: (error: any) => {
        console.error('Error cargando horarios:', error);
        this.horariosDisponibles = [];
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los horarios disponibles'
        });
        this.cargandoHorarios = false;
      }
    });
  }

  generateTimeSlots() {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = this.formatDisplayTime(hour, minute);
        slots.push({
          value: timeString,
          label: displayTime
        });
      }
    }
    this.availableTimeSlots = slots;
  }

  formatDisplayTime(hour: number, minute: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  }

  loadEventData() {
    if (this.editingEvent) {
      const start = new Date(this.editingEvent.start);
      const fecha = start.toISOString().split('T')[0];
      const hora = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`;

      this.citaForm.patchValue({
        fecha,
        hora,
        medicoId: this.editingEvent.data?.medicoId || '',
        servicioId: this.editingEvent.data?.servicioId || '',
        notas: this.editingEvent.data?.notas || ''
      });

      if (this.editingEvent.data?.paciente) {
        this.pacienteSeleccionado = this.editingEvent.data.paciente;
      }
    }
  }

  loadCitaData() {
    if (this.citaData) {
      const fecha = this.citaData.fecha.toISOString().split('T')[0];
      const hora = `${this.citaData.hora.toString().padStart(2, '0')}:00`;

      this.citaForm.patchValue({
        fecha,
        hora,
        medicoId: this.citaData.medicoId || '',
        servicioId: this.citaData.servicioId || ''
      });
    }
  }

  loadPacienteLogueado() {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      console.error('No hay usuario logueado');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No hay usuario logueado'
      });
      return;
    }

    this.usuarioLogueadoId = parseInt(userId);
    this.cargandoPaciente = true;

    console.log('🔍 Cargando paciente con usuario ID:', this.usuarioLogueadoId);

    this.pacienteService.getPacienteDetalleByUsuarioId(this.usuarioLogueadoId).subscribe({
      next: (paciente) => {
        console.log('✅ Paciente cargado:', paciente);
        this.pacienteSeleccionado = paciente;
        this.cargandoPaciente = false;
      },
      error: (error) => {
        console.error('❌ Error cargando paciente:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la información del paciente'
        });
        this.cargandoPaciente = false;
      }
    });
  }

  getModalSubtitle(): string {
    if (this.citaData) {
      return `${this.citaData.fecha.toLocaleDateString('es-ES')} a las ${this.citaData.hora}:00`;
    }
    if (this.editingEvent) {
      const start = new Date(this.editingEvent.start);
      return `${start.toLocaleDateString('es-ES')} a las ${start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return 'Selecciona fecha y hora';
  }

  onSubmit() {
    console.log('🔘 onSubmit() ejecutado');
    console.log('📋 Formulario válido:', this.citaForm.valid);
    console.log('👤 Paciente seleccionado:', this.pacienteSeleccionado);
    console.log('📝 Valores del formulario:', this.citaForm.value);
    console.log('❌ Errores del formulario:', this.citaForm.errors);
    
    // Mostrar errores de cada campo
    Object.keys(this.citaForm.controls).forEach(key => {
      const control = this.citaForm.get(key);
      if (control?.invalid) {
        console.log(`  ❌ Campo "${key}" inválido:`, control.errors);
      }
    });

    if (this.citaForm.valid && this.pacienteSeleccionado) {
      console.log('✅ Validación pasada, creando cita...');
      this.loading = true;

      const formData = this.citaForm.value;
      
      // Construir fechaHora desde fecha + hora o desde agendaId
      let fechaHora: Date;
      
      if (formData.hora) {
        // Si se seleccionó una hora específica
        const [year, month, day] = formData.fecha.split('-').map(Number);
        const [hour, minute] = formData.hora.split(':').map(Number);
        fechaHora = new Date(year, month - 1, day, hour, minute);
      } else if (formData.agendaId && this.horariosDisponibles.length > 0) {
        // Si se seleccionó una agenda, usar su horaInicio
        const agendaSeleccionada = this.horariosDisponibles.find(
          h => (h.id || h.idAgenda) === parseInt(formData.agendaId)
        );
        
        if (agendaSeleccionada) {
          const [year, month, day] = formData.fecha.split('-').map(Number);
          const [hour, minute] = agendaSeleccionada.horaInicio.split(':').map(Number);
          fechaHora = new Date(year, month - 1, day, hour, minute);
        } else {
          // Usar fecha sin hora específica (medianoche)
          const [year, month, day] = formData.fecha.split('-').map(Number);
          fechaHora = new Date(year, month - 1, day, 9, 0); // 9:00 AM por defecto
        }
      } else {
        // Sin hora ni agenda, usar 9:00 AM por defecto
        const [year, month, day] = formData.fecha.split('-').map(Number);
        fechaHora = new Date(year, month - 1, day, 9, 0);
      }

      const citaData = {
        fechaHora: fechaHora.toISOString(),
        pacienteId: this.pacienteSeleccionado.id,
        medicoId: parseInt(formData.medicoId),
        servicioId: parseInt(formData.servicioId),
        motivo: formData.motivo,
        notas: formData.notas || ''
      };

      console.log('📤 Datos de la cita a guardar:', citaData);

      // Guardar en la base de datos
      this.citaService.createCita(citaData).subscribe({
        next: (response) => {
          console.log('✅ Cita creada exitosamente:', response);
          this.loading = false;
          
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Cita agendada correctamente'
          });
          
          this.save.emit(response);
          this.closeModal();
        },
        error: (error) => {
          console.error('❌ Error al crear la cita:', error);
          this.loading = false;
          
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'No se pudo crear la cita. Por favor intente nuevamente.'
          });
        }
      });
    } else {
      console.log('❌ Validación fallida, no se puede crear la cita');
      if (!this.pacienteSeleccionado) {
        console.log('  ⚠️ Falta seleccionar paciente');
        this.messageService.add({
          severity: 'warn',
          summary: 'Paciente requerido',
          detail: 'Debe buscar y seleccionar un paciente'
        });
      }
    }
  }

  closeModal() {
    this.visible = false;
    this.close.emit();
    this.resetForm();
  }

  resetForm() {
    this.citaForm.reset();
    this.isEditing = false;
    // No limpiar pacienteSeleccionado porque siempre es el mismo (usuario logueado)
  }
}