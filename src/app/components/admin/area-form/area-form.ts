import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { Area } from '../../../models/area.model';
import { AreaService } from '../../../services/area';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-area-form',
  standalone: false,
  templateUrl: './area-form.html',
  styleUrls: ['./area-form.css'],
  providers: [MessageService]
})
export class AreaFormComponent implements OnInit {
  activeModule: string = 'areas';
  profileMenuItems: MenuItem[] = [];
  areaForm!: FormGroup;
  
  idArea: number | null = null;
  modoEdicion: boolean = false;
  guardando: boolean = false;
  cargando: boolean = false;
  userName: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private areaService: AreaService,
    public authService: AuthService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initProfileMenu();
    this.loadUserData();
    this.initForm();
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
    this.areaForm = this.fb.group({
      nombreArea: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      descripcion: ['', [Validators.maxLength(500)]],
      estatus: [true]
    });
  }

  checkModoEdicion() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.idArea = +id;
        this.modoEdicion = true;
        this.loadArea();
      } else {
        this.modoEdicion = false;
      }
    });
  }

  loadArea() {
    if (!this.idArea) return;

    this.cargando = true;
    console.log('Cargando área con ID:', this.idArea);

    this.areaService.getAreaById(this.idArea).subscribe({
      next: (area) => {
        console.log('Área cargada:', area);
        this.areaForm.patchValue({
          nombreArea: area.nombreArea,
          descripcion: area.descripcion || '',
          estatus: area.estatus
        });
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar área:', error);
        this.cargando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la información del área'
        });
        this.volver();
      }
    });
  }

  onSubmit() {
    if (this.areaForm.invalid) {
      this.markFormGroupTouched(this.areaForm);
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'Por favor completa todos los campos requeridos'
      });
      return;
    }

    this.guardando = true;

    const areaData: Area = {
      nombreArea: this.areaForm.value.nombreArea.trim(),
      descripcion: this.areaForm.value.descripcion?.trim() || null,
      estatus: this.areaForm.value.estatus
    };

    if (this.modoEdicion && this.idArea) {
      this.actualizarArea(areaData);
    } else {
      this.crearArea(areaData);
    }
  }

  crearArea(areaData: Area) {
    this.areaService.createArea(areaData).subscribe({
      next: (response) => {
        this.guardando = false;
        this.messageService.add({
          severity: 'success',
          summary: '¡Área creada!',
          detail: 'El área ha sido creada exitosamente',
          life: 3000
        });

        setTimeout(() => {
          this.router.navigate(['/admin/areas']);
        }, 1500);
      },
      error: (error) => {
        console.error('Error al crear área:', error);
        this.guardando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'No se pudo crear el área. Intenta nuevamente'
        });
      }
    });
  }

  actualizarArea(areaData: Area) {
    if (!this.idArea) return;

    this.areaService.updateArea(this.idArea, areaData).subscribe({
      next: (response) => {
        this.guardando = false;
        this.messageService.add({
          severity: 'success',
          summary: '¡Área actualizada!',
          detail: 'El área ha sido actualizada exitosamente',
          life: 3000
        });

        setTimeout(() => {
          this.router.navigate(['/admin/areas']);
        }, 1500);
      },
      error: (error) => {
        console.error('Error al actualizar área:', error);
        this.guardando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'No se pudo actualizar el área. Intenta nuevamente'
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
    const field = this.areaForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.areaForm.get(fieldName);
    
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
    
    return '';
  }

  volver() {
    this.router.navigate(['/admin/areas']);
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