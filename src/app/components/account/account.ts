import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Usuario, Sexo } from '../../models/usuario.model';
import { MedicoDetalle } from '../../models/medicoDetalle.model';
import { PacienteDetalle } from '../../models/pacienteDetalle.model';
import { UserService } from '../../services/user';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MenuModule,
    ButtonModule,
    CardModule,
    DialogModule,
    InputTextModule,
    DatePickerModule,
    SelectModule,
    PasswordModule,
    ToastModule
  ],
  templateUrl: './account.html',
  styleUrl: './account.css',
  providers: [MessageService]
})
export class Account implements OnInit {
  // Información del usuario
  usuario: Usuario | null = null;
  medicoDetalle: MedicoDetalle | null = null;
  pacienteDetalle: PacienteDetalle | null = null;

  // Estados de carga y edición
  loading: boolean = true;
  editandoPerfil: boolean = false;
  cambiandoPassword: boolean = false;

  // Formularios de edición
  usuarioEditando: Partial<Usuario> = {};
  passwordActual: string = '';
  passwordNueva: string = '';
  passwordConfirmar: string = '';

  // Opciones para dropdowns
  opcionesSexo = [
    { label: 'Masculino', value: Sexo.Masculino },
    { label: 'Femenino', value: Sexo.Femenino }
  ];

  // Menú de navegación
  profileMenuItems: MenuItem[] = [
    {
      label: 'Mi Perfil',
      icon: 'pi pi-user',
      command: () => this.editarPerfil()
    },
    {
      label: 'Cambiar Contraseña',
      icon: 'pi pi-lock',
      command: () => this.cambiarPassword()
    },
    {
      label: 'Cerrar Sesión',
      icon: 'pi pi-sign-out',
      command: () => this.logout()
    }
  ];

  constructor(
    public router: Router,
    private userService: UserService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  // Cargar información del perfil del usuario
  loadUserProfile(): void {
    this.loading = true;

    // Verificar si estamos en el navegador antes de acceder a localStorage
    if (!isPlatformBrowser(this.platformId)) {
      this.loading = false;
      return;
    }

    const userId = localStorage.getItem('userId');

    if (!userId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se encontró información del usuario. Por favor inicia sesión nuevamente.'
      });
      this.router.navigate(['/login']);
      return;
    }

    // Obtener los datos reales del usuario desde el backend
    this.userService.getById(Number(userId)).subscribe({
      next: (usuario) => {
        this.usuario = usuario;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar perfil:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la información del perfil.'
        });
        this.loading = false;
      }
    });
  }

  // Verificar si el usuario es médico
  get esMedico(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    const userRole = localStorage.getItem('userRole');
    return userRole === 'MEDICO' || userRole === '2';
  }

  // Verificar si el usuario es paciente
  get esPaciente(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    const userRole = localStorage.getItem('userRole');
    return userRole === 'PACIENTE' || userRole === '3';
  }

  // Abrir modal de edición de perfil
  editarPerfil(): void {
    this.usuarioEditando = { ...this.usuario };
    this.editandoPerfil = true;
  }

  // Guardar cambios del perfil
  guardarPerfil(): void {
    if (!this.usuarioEditando.nombre || !this.usuarioEditando.correoElectronico) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Los campos nombre y correo electrónico son obligatorios.'
      });
      return;
    }

    if (!this.usuario?.idUsuario) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo identificar al usuario.'
      });
      return;
    }

    // Preparar los datos para actualizar
    const updateData: any = {};

    // Solo incluir campos que tienen valores válidos
    if (this.usuarioEditando.nombre?.trim()) {
      updateData.nombre = this.usuarioEditando.nombre.trim();
    }
    if (this.usuarioEditando.apellidoPaterno?.trim()) {
      updateData.apellidoPaterno = this.usuarioEditando.apellidoPaterno.trim();
    }
    if (this.usuarioEditando.apellidoMaterno?.trim()) {
      updateData.apellidoMaterno = this.usuarioEditando.apellidoMaterno.trim();
    }
    if (this.usuarioEditando.sexo) {
      updateData.sexo = this.usuarioEditando.sexo;
    }
    if (this.usuarioEditando.fechaNacimiento) {
      // Convertir fecha a formato ISO string si es un objeto Date
      const fecha = this.usuarioEditando.fechaNacimiento;
      if (typeof fecha === 'object' && fecha !== null && 'toISOString' in fecha) {
        updateData.fechaNacimiento = (fecha as Date).toISOString().split('T')[0];
      } else if (typeof fecha === 'string') {
        updateData.fechaNacimiento = fecha;
      }
    }
    if (this.usuarioEditando.direccion?.trim()) {
      updateData.direccion = this.usuarioEditando.direccion.trim();
    }
    if (this.usuarioEditando.telefono?.trim()) {
      updateData.telefono = this.usuarioEditando.telefono.trim();
    }
    if (this.usuarioEditando.correoElectronico?.trim()) {
      updateData.correoElectronico = this.usuarioEditando.correoElectronico.trim();
    }

    console.log('Datos a enviar para actualización:', updateData);
    console.log('ID del usuario:', this.usuario.idUsuario);

    // Llamar al servicio para actualizar en el backend
    this.userService.update(this.usuario.idUsuario, updateData).subscribe({
      next: (usuarioActualizado) => {
        // Actualizar el usuario local con los datos del backend
        this.usuario = usuarioActualizado;
        this.editandoPerfil = false;

        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Perfil actualizado correctamente.'
        });
      },
      error: (error) => {
        console.error('Error al actualizar perfil:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el perfil. Inténtalo de nuevo.'
        });
      }
    });
  }

  // Abrir modal de cambio de contraseña
  cambiarPassword(): void {
    this.passwordActual = '';
    this.passwordNueva = '';
    this.passwordConfirmar = '';
    this.cambiandoPassword = true;
  }

  // Cambiar contraseña
  guardarPassword(): void {
    if (!this.passwordActual || !this.passwordNueva || !this.passwordConfirmar) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Todos los campos de contraseña son obligatorios.'
      });
      return;
    }

    if (this.passwordNueva !== this.passwordConfirmar) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'La nueva contraseña y su confirmación no coinciden.'
      });
      return;
    }

    if (this.passwordNueva.length < 6) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'La nueva contraseña debe tener al menos 6 caracteres.'
      });
      return;
    }

    // Llamar al servicio para cambiar la contraseña
    const changePasswordData = {
      currentPassword: this.passwordActual,
      newPassword: this.passwordNueva
    };

    this.authService.changePassword(changePasswordData).subscribe({
      next: () => {
        this.cambiandoPassword = false;
        this.passwordActual = '';
        this.passwordNueva = '';
        this.passwordConfirmar = '';

        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Contraseña cambiada correctamente.'
        });
      },
      error: (error) => {
        console.error('Error al cambiar contraseña:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'No se pudo cambiar la contraseña. Inténtalo de nuevo.'
        });
      }
    });
  }

  // Cerrar sesión
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.clear();
    }
    this.router.navigate(['/home']);
  }

  // Cancelar edición
  cancelarEdicion(): void {
    this.editandoPerfil = false;
    this.cambiandoPassword = false;
  }

  // Formatear fecha para mostrar
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-ES');
  }
}
