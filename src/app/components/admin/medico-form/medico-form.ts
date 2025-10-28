import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { MedicoDetalle } from '../../../models/medicoDetalle.model';
import { Servicio } from '../../../models/servicio.model';
import { Usuario, Sexo } from '../../../models/usuario.model';
import { MedicoService } from '../../../services/medico';
import { ServicioService } from '../../../services/servicio';
import { AuthService } from '../../../services/auth';
import { UserService } from '../../../services/user';

@Component({
  selector: 'app-medico-form',
  standalone: false,
  templateUrl: './medico-form.html',
  styleUrls: ['./medico-form.css'],
  providers: [MessageService]
})
export class MedicoFormComponent implements OnInit {
  activeModule: string = 'medicos';
  profileMenuItems: MenuItem[] = [];
  medicoForm!: FormGroup;
  
  idMedico: number | null = null;
  modoEdicion: boolean = false;
  guardando: boolean = false;
  cargando: boolean = false;
  cargandoServicios: boolean = false;
  userName: string = '';
  maxDate: Date = new Date();
  
  servicios: Servicio[] = [];
  sexos = [
    { label: 'Masculino', value: Sexo.Masculino },
    { label: 'Femenino', value: Sexo.Femenino }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private medicoService: MedicoService,
    private servicioService: ServicioService,
    private usuarioService: UserService,
    public authService: AuthService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initProfileMenu();
    this.loadUserData();
    this.initForm();
    this.loadServicios();
    this.checkModoEdicion();
  }

  initProfileMenu() {
    this.profileMenuItems = [
      {
        label: 'Acceder al perfil',
        icon: 'pi pi-user',
        command: () => this.navigateTo('/perfil')
      },
      {
        label: 'Configuración',
        icon: 'pi pi-cog',
        command: () => this.navigateTo('/configuracion')
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

  loadUserData() {
    this.userName = localStorage.getItem('userName') || 'Administrador';
  }

  initForm() {
    this.medicoForm = this.fb.group({
      // Información personal
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      apellidoPaterno: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      apellidoMaterno: ['', [Validators.maxLength(255)]],
      correoElectronico: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      direccion: ['', [Validators.maxLength(255)]],
      fechaNacimiento: [null],
      sexo: [null, Validators.required],
      telefono: ['', [Validators.maxLength(15)]],
      
      // Información profesional
      cedulaProfesional: ['', [Validators.required, Validators.maxLength(255)]],
      
      // Servicios asignados
      servicios: this.fb.array([], Validators.required)
    });
  }

  get serviciosArray(): FormArray {
    return this.medicoForm.get('servicios') as FormArray;
  }

  // CORREGIDO: Crear un FormGroup para cada servicio
  addServicio(servicioId?: number) {
    const servicioGroup = this.fb.group({
      idServicio: [servicioId || null, Validators.required]
    });
    this.serviciosArray.push(servicioGroup);
  }

  removeServicio(index: number) {
    this.serviciosArray.removeAt(index);
  }

  // ELIMINADO: onServicioChange ya no es necesario

  agregarOtroServicio() {
    this.addServicio();
  }

  loadServicios() {
    this.cargandoServicios = true;
    
    this.servicioService.getAllServicios().subscribe({
      next: (servicios) => {
        console.log('✅ Servicios cargados:', servicios);
        this.servicios = servicios;
        this.cargandoServicios = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error al cargar servicios:', error);
        this.cargandoServicios = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los servicios'
        });
      }
    });
  }

  checkModoEdicion() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      console.log('🔍 Parámetro ID recibido:', id);
      if (id) {
        this.idMedico = +id;
        this.modoEdicion = true;
        this.loadMedico();
      } else {
        this.modoEdicion = false;
        // En modo creación, agregar un servicio vacío por defecto
        this.addServicio();
      }
    });
  }

  loadMedico() {
    if (!this.idMedico) {
      console.error('❌ No hay ID de médico para cargar');
      return;
    }

    this.cargando = true;
    console.log('🔄 Cargando médico con ID:', this.idMedico);

    this.medicoService.getMedicoById(this.idMedico).subscribe({
      next: (medicoDetalle) => {
        console.log('✅ Médico cargado exitosamente:', medicoDetalle);
        
        if (medicoDetalle && medicoDetalle.usuario) {
          const usuario = medicoDetalle.usuario;
          
          // Cargar información del usuario
          this.medicoForm.patchValue({
            nombre: usuario.nombre,
            apellidoPaterno: usuario.apellidoPaterno,
            apellidoMaterno: usuario.apellidoMaterno || '',
            correoElectronico: usuario.correoElectronico,
            direccion: usuario.direccion || '',
            fechaNacimiento: usuario.fechaNacimiento ? new Date(usuario.fechaNacimiento) : null,
            sexo: usuario.sexo,
            telefono: usuario.telefono || '',
            cedulaProfesional: medicoDetalle.cedulaProfecional || ''
          });

          // Cargar servicios
          this.cargarServiciosDelMedico(usuario.idUsuario);
        } else {
          console.warn('⚠️ El médico cargado es null o undefined');
          this.messageService.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'No se encontró información del médico'
          });
          this.cargando = false;
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar médico:', error);
        console.error('Detalles del error:', error.error);
        this.cargando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la información del médico: ' + (error.error?.message || error.message)
        });
        setTimeout(() => this.volver(), 2000);
      }
    });
  }

  cargarServiciosDelMedico(idUsuario: number | undefined) {
    if (!idUsuario) {
      this.cargando = false;
      return;
    }

    // Necesitarías un endpoint para obtener todos los registros de médico_detalle por usuario
    this.medicoService.getMedicosByUsuario(idUsuario).subscribe({
      next: (medicos) => {
        // Limpiar servicios existentes
        while (this.serviciosArray.length !== 0) {
          this.serviciosArray.removeAt(0);
        }
        
        // Agregar servicios del médico
        medicos.forEach(medico => {
          this.addServicio(medico.idServicio || undefined);
        });
        
        // Si no hay servicios, agregar uno vacío
        if (medicos.length === 0) {
          this.addServicio();
        }
        
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error al cargar servicios del médico:', error);
        // En caso de error, al menos asegurar que hay un servicio vacío
        if (this.serviciosArray.length === 0) {
          this.addServicio();
        }
        this.cargando = false;
      }
    });
  }

  onSubmit() {
    if (this.medicoForm.invalid) {
      this.markFormGroupTouched(this.medicoForm);
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'Por favor completa todos los campos requeridos correctamente'
      });
      return;
    }

    // Validar que al menos un servicio esté seleccionado
    const serviciosSeleccionados = this.serviciosArray.controls
      .map(control => control.get('idServicio')?.value)
      .filter(servicioId => servicioId);

    if (serviciosSeleccionados.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Servicios requeridos',
        detail: 'Debe asignar al menos un servicio al médico'
      });
      return;
    }

    this.guardando = true;

    const formValue = this.medicoForm.value;

    // Preparar datos del usuario (ROL 2 - MÉDICO)
    const usuarioData: any = {
      nombre: formValue.nombre.trim(),
      apellidoPaterno: formValue.apellidoPaterno.trim(),
      apellidoMaterno: formValue.apellidoMaterno?.trim() || null,
      correoElectronico: formValue.correoElectronico.trim(),
      direccion: formValue.direccion?.trim() || null,
      fechaNacimiento: formValue.fechaNacimiento ? this.formatDate(formValue.fechaNacimiento) : null,
      sexo: formValue.sexo,
      telefono: formValue.telefono?.trim() || null,
      contraseña: 'password',
      rolUser: {
        idRol: 2 // ROL MÉDICO
      }
    };

    console.log('💾 Guardando médico:', { 
      usuarioData, 
      servicios: serviciosSeleccionados,
      cedulaProfesional: formValue.cedulaProfesional 
    });

    if (this.modoEdicion && this.idMedico) {
      this.actualizarMedico(usuarioData, serviciosSeleccionados, formValue.cedulaProfesional);
    } else {
      this.crearMedico(usuarioData, serviciosSeleccionados, formValue.cedulaProfesional);
    }
  }

  crearMedico(usuarioData: any, servicios: number[], cedulaProfesional: string) {
    // Primero crear el usuario
    this.usuarioService.create(usuarioData).subscribe({
      next: (usuarioCreado) => {
        console.log('✅ Usuario médico creado:', usuarioCreado);
        
        // Luego crear los registros en medico_detalle para cada servicio
        this.crearRegistrosMedicoDetalle(usuarioCreado.idUsuario!, servicios, cedulaProfesional);
      },
      error: (error) => {
        console.error('❌ Error al crear usuario médico:', error);
        this.guardando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'No se pudo crear el médico. Intenta nuevamente'
        });
      }
    });
  }

  crearRegistrosMedicoDetalle(idUsuario: number, servicios: number[], cedulaProfesional: string) {
  const requests = servicios.map(servicioId => {
    // Crear el objeto con la estructura que espera el backend
    const medicoDetalleData = {
      usuario: { 
        idUsuario: idUsuario 
      },
      servicio: { 
        id: servicioId 
      },
      cedulaProfecional: cedulaProfesional
    };
    
    console.log('📝 Enviando datos para médico_detalle:', medicoDetalleData);
    
    return this.medicoService.createMedico(medicoDetalleData).toPromise();
  });

  Promise.all(requests)
    .then((results) => {
      console.log('✅ Todos los registros de médico_detalle creados:', results);
      this.guardando = false;
      this.messageService.add({
        severity: 'success',
        summary: '¡Médico creado!',
        detail: 'El médico ha sido creado exitosamente',
        life: 3000
      });

      setTimeout(() => {
        this.router.navigate(['/admin/medicos']);
      }, 1500);
    })
    .catch(error => {
      console.error('❌ Error al crear registros de médico_detalle:', error);
      console.error('Detalles del error:', error.error);
      this.guardando = false;
      
      let errorMessage = 'No se pudieron asignar todos los servicios al médico';
      if (error.error?.message) {
        errorMessage += `: ${error.error.message}`;
      }
      
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage
      });
    });
}

  actualizarMedico(usuarioData: any, servicios: number[], cedulaProfesional: string) {
    // Para simplificar, en modo edición solo manejamos creación por ahora
    console.log('Actualización no implementada completamente');
    this.guardando = false;
    this.messageService.add({
      severity: 'warn',
      summary: 'Funcionalidad en desarrollo',
      detail: 'La edición de médicos estará disponible pronto'
    });
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          } else {
            arrayControl.markAsTouched();
          }
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.medicoForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.medicoForm.get(fieldName);
    
    if (field?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength']?.requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }
    
    if (field?.hasError('maxlength')) {
      const maxLength = field.errors?.['maxlength']?.requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }
    
    if (field?.hasError('email')) {
      return 'Formato de email inválido';
    }
    
    return '';
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getNombreServicio(idServicio: number): string {
    const servicio = this.servicios.find(s => s.id === idServicio);
    return servicio?.nombreServicio || 'Servicio no encontrado';
  }

  volver() {
    this.router.navigate(['/admin/medicos']);
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
    this.router.navigate([`/admin/${module}`]);
  }
}