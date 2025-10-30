import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CalendarEvent } from '../calendar/calendar.component';

export interface CitaModalData {
  fecha: Date;
  hora: number;
  medicoId?: number;
  pacienteId?: number;
  servicioId?: number;
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
                Paciente
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Buscar Paciente</label>
                  <div class="relative">
                    <input
                      type="text"
                      formControlName="buscarPaciente"
                      placeholder="Nombre, teléfono o email..."
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      (input)="buscarPacientes($event)">
                    <i class="pi pi-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  </div>
                  
                  <!-- Lista de pacientes encontrados -->
                  <div *ngIf="pacientesEncontrados.length > 0" 
                       class="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                    <div 
                      *ngFor="let paciente of pacientesEncontrados"
                      (click)="seleccionarPaciente(paciente)"
                      class="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                      <div class="font-medium">{{ paciente.usuario?.nombre }} {{ paciente.usuario?.apellidoPaterno }}</div>
                      <div class="text-sm text-gray-500">{{ paciente.usuario?.correoElectronico }}</div>
                      <div class="text-sm text-gray-500">{{ paciente.usuario?.telefono }}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Paciente Seleccionado</label>
                  <div *ngIf="pacienteSeleccionado" 
                       class="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div class="font-medium text-green-800">
                      {{ pacienteSeleccionado.usuario?.nombre }} {{ pacienteSeleccionado.usuario?.apellidoPaterno }}
                    </div>
                    <div class="text-sm text-green-600">{{ pacienteSeleccionado.usuario?.correoElectronico }}</div>
                    <button 
                      type="button"
                      (click)="limpiarPaciente()"
                      class="text-red-500 text-xs mt-1 hover:underline">
                      Limpiar selección
                    </button>
                  </div>
                  <div *ngIf="!pacienteSeleccionado" 
                       class="p-3 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
                    No hay paciente seleccionado
                  </div>
                </div>
              </div>
            </div>

            <!-- Información del Médico y Servicio -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Médico -->
              <div>
                <h3 class="font-semibold text-gray-800 mb-3 flex items-center">
                  <i class="pi pi-user-plus mr-2 text-blue-600"></i>
                  Médico
                </h3>
                
                <select
                  formControlName="medicoId"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Seleccionar médico</option>
                  <option *ngFor="let medico of medicosDisponibles" [value]="medico.id">
                    Dr. {{ medico.usuario?.nombre }} {{ medico.usuario?.apellidoPaterno }}
                  </option>
                </select>
                <div *ngIf="citaForm.get('medicoId')?.invalid && citaForm.get('medicoId')?.touched" 
                     class="text-red-500 text-xs mt-1">
                  El médico es requerido
                </div>
              </div>

              <!-- Servicio -->
              <div>
                <h3 class="font-semibold text-gray-800 mb-3 flex items-center">
                  <i class="pi pi-list mr-2 text-blue-600"></i>
                  Servicio
                </h3>
                
                <select
                  formControlName="servicioId"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Seleccionar servicio</option>
                  <option *ngFor="let servicio of serviciosDisponibles" [value]="servicio.id">
                    {{ servicio.nombre }}
                  </option>
                </select>
                <div *ngIf="citaForm.get('servicioId')?.invalid && citaForm.get('servicioId')?.touched" 
                     class="text-red-500 text-xs mt-1">
                  El servicio es requerido
                </div>
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
  medicosDisponibles: any[] = [];
  serviciosDisponibles: any[] = [];
  availableTimeSlots: { value: string, label: string }[] = [];

  // Búsqueda de pacientes
  pacientesEncontrados: any[] = [];
  pacienteSeleccionado: any = null;

  constructor(private fb: FormBuilder) {
    this.citaForm = this.fb.group({
      fecha: ['', Validators.required],
      hora: ['', Validators.required],
      buscarPaciente: [''],
      medicoId: ['', Validators.required],
      servicioId: ['', Validators.required],
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
    // Aquí cargarías los médicos y servicios desde los servicios correspondientes
    // Por ahora, datos de ejemplo
    this.medicosDisponibles = [
      {
        id: 1,
        usuario: { nombre: 'Juan', apellidoPaterno: 'Pérez' },
        especialidad: 'Cardiología'
      },
      {
        id: 2,
        usuario: { nombre: 'María', apellidoPaterno: 'García' },
        especialidad: 'Pediatría'
      }
    ];

    this.serviciosDisponibles = [
      { id: 1, nombre: 'Consulta General' },
      { id: 2, nombre: 'Consulta Especializada' },
      { id: 3, nombre: 'Revisión' }
    ];
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

  buscarPacientes(event: any) {
    const query = event.target.value;
    if (query.length >= 3) {
      // Aquí harías la búsqueda real en el servicio
      // Por ahora, datos de ejemplo
      this.pacientesEncontrados = [
        {
          id: 1,
          usuario: {
            nombre: 'Ana',
            apellidoPaterno: 'López',
            correoElectronico: 'ana.lopez@email.com',
            telefono: '555-0123'
          }
        },
        {
          id: 2,
          usuario: {
            nombre: 'Carlos',
            apellidoPaterno: 'Martínez',
            correoElectronico: 'carlos.martinez@email.com',
            telefono: '555-0456'
          }
        }
      ].filter(p => 
        p.usuario.nombre.toLowerCase().includes(query.toLowerCase()) ||
        p.usuario.apellidoPaterno.toLowerCase().includes(query.toLowerCase()) ||
        p.usuario.correoElectronico.toLowerCase().includes(query.toLowerCase())
      );
    } else {
      this.pacientesEncontrados = [];
    }
  }

  seleccionarPaciente(paciente: any) {
    this.pacienteSeleccionado = paciente;
    this.pacientesEncontrados = [];
    this.citaForm.patchValue({
      buscarPaciente: `${paciente.usuario.nombre} ${paciente.usuario.apellidoPaterno}`
    });
  }

  limpiarPaciente() {
    this.pacienteSeleccionado = null;
    this.citaForm.patchValue({
      buscarPaciente: ''
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
    if (this.citaForm.valid && this.pacienteSeleccionado) {
      this.loading = true;

      const formData = this.citaForm.value;
      const [year, month, day] = formData.fecha.split('-').map(Number);
      const [hour, minute] = formData.hora.split(':').map(Number);

      const fechaHora = new Date(year, month - 1, day, hour, minute);

      const citaData = {
        id: this.editingEvent?.id,
        fechaHora: fechaHora.toISOString(),
        pacienteId: this.pacienteSeleccionado.id,
        medicoId: parseInt(formData.medicoId),
        servicioId: parseInt(formData.servicioId),
        notas: formData.notas,
        paciente: this.pacienteSeleccionado
      };

      // Simular guardado
      setTimeout(() => {
        this.loading = false;
        this.save.emit(citaData);
        this.closeModal();
      }, 1000);
    }
  }

  closeModal() {
    this.visible = false;
    this.close.emit();
    this.resetForm();
  }

  resetForm() {
    this.citaForm.reset();
    this.pacienteSeleccionado = null;
    this.pacientesEncontrados = [];
    this.isEditing = false;
  }
}