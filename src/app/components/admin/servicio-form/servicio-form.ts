import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { Servicio } from '../../../models/servicio.model';
import { Area } from '../../../models/area.model';
import { ServicioService } from '../../../services/servicio';
import { AreaService } from '../../../services/area';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-servicio-form',
  standalone: false,
  templateUrl: './servicio-form.html',
  styleUrls: ['./servicio-form.css'],
  providers: [MessageService]
})
export class ServicioFormComponent implements OnInit {
  activeModule: string = 'servicios';
  profileMenuItems: MenuItem[] = [];
  servicioForm!: FormGroup;
  
  idServicio: number | null = null;
  modoEdicion: boolean = false;
  guardando: boolean = false;
  cargando: boolean = false;
  cargandoAreas: boolean = false;
  userName: string = '';
  
  areas: Area[] = [];
  duracionesPreset = [
    { label: '15 minutos', value: 15 },
    { label: '30 minutos', value: 30 },
    { label: '45 minutos', value: 45 },
    { label: '1 hora', value: 60 },
    { label: '1 hora 30 min', value: 90 },
    { label: '2 horas', value: 120 },
    { label: '3 horas', value: 180 },
    { label: 'Personalizado', value: -1 }
  ];
  duracionPersonalizada: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private servicioService: ServicioService,
    private areaService: AreaService,
    public authService: AuthService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initProfileMenu();
    this.loadUserData();
    this.initForm();
    this.loadAreas();
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
    this.servicioForm = this.fb.group({
      nombreServicio: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      descripcion: ['', [Validators.required, Validators.maxLength(255)]],
      costo: [null, [Validators.required, Validators.min(0), Validators.max(999999.99)]],
      idArea: [null, Validators.required],
      duracion: [30, [Validators.required, Validators.min(5), Validators.max(480)]],
      duracionPreset: [30]
    });

    // Listener para cambios en duracionPreset
    this.servicioForm.get('duracionPreset')?.valueChanges.subscribe(value => {
      console.log('🔄 Cambio en duracionPreset:', value);
      if (value === -1) {
        this.duracionPersonalizada = true;
        this.servicioForm.get('duracion')?.setValue(30);
      } else {
        this.duracionPersonalizada = false;
        this.servicioForm.get('duracion')?.setValue(value);
      }
    });
  }

  loadAreas() {
    this.cargandoAreas = true;
    
    this.areaService.getAreas().subscribe({
      next: (areas) => {
        console.log('✅ Áreas cargadas:', areas);
        // Filtrar solo áreas activas
        this.areas = areas.filter(a => a.estatus);
        this.cargandoAreas = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error al cargar áreas:', error);
        this.cargandoAreas = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las áreas'
        });
      }
    });
  }

  checkModoEdicion() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      console.log('🔍 Parámetro ID recibido:', id);
      if (id) {
        this.idServicio = +id;
        this.modoEdicion = true;
        this.loadServicio();
      } else {
        this.modoEdicion = false;
      }
    });
  }

  loadServicio() {
    if (!this.idServicio) {
      console.error('❌ No hay ID de servicio para cargar');
      return;
    }

    this.cargando = true;
    console.log('🔄 Cargando servicio con ID:', this.idServicio);

    this.servicioService.getServicioById(this.idServicio).subscribe({
      next: (servicio) => {
        console.log('✅ Servicio cargado exitosamente:', servicio);
        
        if (servicio) {
          // Verificar si la duración está en los presets
          const duracionEnPreset = this.duracionesPreset.find(d => d.value === servicio.duracion);
          
          console.log('⏱️ Duración del servicio:', servicio.duracion);
          console.log('🎯 Duración en preset:', duracionEnPreset);

          if (!duracionEnPreset) {
            this.duracionPersonalizada = true;
            this.servicioForm.patchValue({
              duracionPreset: -1,
              duracion: servicio.duracion
            });
          } else {
            this.duracionPersonalizada = false;
            this.servicioForm.patchValue({
              duracionPreset: servicio.duracion,
              duracion: servicio.duracion
            });
          }

          // Actualizar el resto de los campos
          this.servicioForm.patchValue({
            nombreServicio: servicio.nombreServicio,
            descripcion: servicio.descripcionServicio || '',
            costo: servicio.costo,
            idArea: servicio.idArea
          });

          console.log('📝 Formulario actualizado:', this.servicioForm.value);
        } else {
          console.warn('⚠️ El servicio cargado es null o undefined');
          this.messageService.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'No se encontró información del servicio'
          });
        }
        
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error al cargar servicio:', error);
        console.error('Detalles del error:', error.error);
        this.cargando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la información del servicio: ' + (error.error?.message || error.message)
        });
        setTimeout(() => this.volver(), 2000);
      }
    });
  }

  onSubmit() {
    if (this.servicioForm.invalid) {
      this.markFormGroupTouched(this.servicioForm);
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'Por favor completa todos los campos requeridos correctamente'
      });
      return;
    }

    this.guardando = true;

    // Asegurarnos de que idArea no sea null
    const idAreaValue = this.servicioForm.value.idArea;
    if (!idAreaValue) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Debes seleccionar un área médica'
      });
      this.guardando = false;
      return;
    }

    const servicioData: any = {
      nombreServicio: this.servicioForm.value.nombreServicio.trim(),
      descripcionServicio: this.servicioForm.value.descripcion.trim(),
      costo: parseFloat(this.servicioForm.value.costo),
      idArea: idAreaValue,
      duracion: this.servicioForm.value.duracion
    };

    // Si estamos en modo edición, incluir el ID
    if (this.modoEdicion && this.idServicio) {
      servicioData.id = this.idServicio;
    }

    console.log('💾 Guardando servicio:', servicioData);

    if (this.modoEdicion && this.idServicio) {
      this.actualizarServicio(servicioData);
    } else {
      this.crearServicio(servicioData);
    }
  }

  crearServicio(servicioData: any) {
    this.servicioService.createServicio(servicioData).subscribe({
      next: (response) => {
        console.log('✅ Servicio creado exitosamente:', response);
        this.guardando = false;
        this.messageService.add({
          severity: 'success',
          summary: '¡Servicio creado!',
          detail: 'El servicio ha sido creado exitosamente',
          life: 3000
        });

        setTimeout(() => {
          this.router.navigate(['/admin/servicios']);
        }, 1500);
      },
      error: (error) => {
        console.error('❌ Error al crear servicio:', error);
        console.error('Detalles del error:', error.error);
        this.guardando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'No se pudo crear el servicio. Intenta nuevamente'
        });
      }
    });
  }

  actualizarServicio(servicioData: any) {
    if (!this.idServicio) return;

    this.servicioService.updateServicio(this.idServicio, servicioData).subscribe({
      next: (response) => {
        console.log('✅ Servicio actualizado exitosamente:', response);
        this.guardando = false;
        this.messageService.add({
          severity: 'success',
          summary: '¡Servicio actualizado!',
          detail: 'El servicio ha sido actualizado exitosamente',
          life: 3000
        });

        setTimeout(() => {
          this.router.navigate(['/admin/servicios']);
        }, 1500);
      },
      error: (error) => {
        console.error('❌ Error al actualizar servicio:', error);
        console.error('Detalles del error:', error.error);
        this.guardando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'No se pudo actualizar el servicio. Intenta nuevamente'
        });
      }
    });
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.servicioForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.servicioForm.get(fieldName);
    
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
    
    if (field?.hasError('min')) {
      const min = field.errors?.['min']?.min;
      return `El valor mínimo es ${min}`;
    }
    
    if (field?.hasError('max')) {
      const max = field.errors?.['max']?.max;
      return `El valor máximo es ${max}`;
    }
    
    return '';
  }

  getNombreArea(idArea: number): string {
    const area = this.areas.find(a => a.id === idArea);
    return area?.nombreArea || 'Área no encontrada';
  }

  formatDuracion(minutos: number): string {
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
  }

  volver() {
    this.router.navigate(['/admin/servicios']);
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