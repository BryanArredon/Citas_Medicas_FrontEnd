import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem, ConfirmationService, MessageService } from 'primeng/api';
import { MedicoDetalle } from '../../../models/medicoDetalle.model';
import { HttpErrorResponse } from '@angular/common/http';
import { MedicoService } from '../../../services/medico';
import { AuthService } from '../../../services/auth';
import { UserService } from '../../../services/user';

@Component({
  selector: 'app-admin-medicos',
  standalone: false,
  templateUrl: './medico.html',
  styleUrls: ['./medico.css'],
  providers: [ConfirmationService, MessageService],
})
export class AdminMedicoComponent implements OnInit {
  activeModule: string = 'medicos';
  profileMenuItems: MenuItem[] = [];
  medicos: any[] = []; // Cambiado a any[] para soportar médicos agrupados
  cargandoMedicos: boolean = false;
  userName: string = '';
  userRole: number | null = null;
  searchTerm: string = '';

  constructor(
    private router: Router,
    private medicoService: MedicoService,
    public authService: AuthService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private usuarioService: UserService
  ) {}

  ngOnInit() {
    this.initProfileMenu();
    this.loadUserData();
    this.loadMedicos();
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
    this.userRole = this.authService.getCurrentUserRole();
  }

  loadMedicos() {
    this.cargandoMedicos = true;
    
    // Usar el endpoint que agrupa por usuario
    this.medicoService.getMedicosConServicios().subscribe({
      next: (medicosAgrupados) => {
        this.medicos = medicosAgrupados;
        this.cargandoMedicos = false;
        this.cdr.detectChanges();
        console.log('✅ Médicos agrupados cargados:', this.medicos);
      },
      error: (error) => {
        console.error('❌ Error al cargar médicos:', error);
        this.cargandoMedicos = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los médicos'
        });
      }
    });
  }

  agregarMedico() {
    this.router.navigate(['/admin/medicos/medico-form']);
  }

  editarMedico(medicoAgrupado: any) {
    // Editar usando el primer registro de médico
    const primerRegistro = medicoAgrupado.registros[0];
    this.router.navigate(['/admin/medicos/medico-form', primerRegistro.medicoId]);
  }

  confirmarEliminar(medicoAgrupado: any, event: Event) {
    const nombreCompleto = `Dr. ${medicoAgrupado.nombre} ${medicoAgrupado.apellidoPaterno} ${medicoAgrupado.apellidoMaterno || ''}`.trim();
    const cantidadServicios = medicoAgrupado.totalRegistros;
    
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `¿Estás seguro de que deseas eliminar al médico "${nombreCompleto}"? Se eliminarán ${cantidadServicios} registro(s) de servicios.`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.eliminarMedico(medicoAgrupado);
      }
    });
  }

  eliminarMedico(medicoAgrupado: any) {
  const usuarioId = medicoAgrupado.usuarioId;
  const nombreCompleto = `Dr. ${medicoAgrupado.nombre} ${medicoAgrupado.apellidoPaterno} ${medicoAgrupado.apellidoMaterno || ''}`.trim();

  console.log('🗑️ Eliminando todos los registros del médico - Usuario ID:', usuarioId);

  // Eliminar todos los registros de médico_detalle de este usuario
  this.medicoService.deleteMedicosByUsuario(usuarioId).subscribe({
    next: () => {
      console.log('✅ Registros de médico eliminados, eliminando usuario...');
      this.eliminarUsuario(usuarioId, nombreCompleto);
    },
    error: (error) => {
      console.error('❌ Error al eliminar médico:', error);
      
      let errorMessage = 'No se pudo eliminar el médico. ';
      if (error.status === 500) {
        errorMessage += 'Puede tener citas o horarios asociados.';
      } else {
        errorMessage += error.error?.message || error.message;
      }

      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage
      });
    }
  });
}

// Método auxiliar para eliminar usuario
private eliminarUsuario(usuarioId: number, nombreMedico: string) {
  // Necesitarías agregar este método en UserService
  this.usuarioService.delete(usuarioId).subscribe({
    next: () => {
      console.log('✅ Usuario eliminado exitosamente');
      this.messageService.add({
        severity: 'success',
        summary: 'Médico eliminado',
        detail: `El médico "${nombreMedico}" fue eliminado completamente del sistema`,
        life: 3000
      });
      this.loadMedicos();
    },
    error: (error: HttpErrorResponse) => {
  console.error('❌ Error al eliminar usuario:', error.message);
  this.messageService.add({
    severity: 'success',
    summary: 'Médico eliminado',
    detail: `El médico "${nombreMedico}" fue eliminado (registro médico eliminado)`,
    life: 3000
  });
  this.loadMedicos();
}
  });
}

  get medicosFiltrados(): any[] {
    if (!this.searchTerm.trim()) {
      return this.medicos;
    }
    
    const term = this.searchTerm.toLowerCase();
    return this.medicos.filter(medico =>
      medico.nombre.toLowerCase().includes(term) ||
      medico.apellidoPaterno.toLowerCase().includes(term) ||
      medico.apellidoMaterno?.toLowerCase().includes(term) ||
      medico.cedula?.toLowerCase().includes(term) ||
      medico.registros.some((r: any) => r.servicio.toLowerCase().includes(term))
    );
  }

  getNombreCompleto(medico: any): string {
    return `Dr. ${medico.nombre} ${medico.apellidoPaterno} ${medico.apellidoMaterno || ''}`.trim();
  }

  getServicios(medico: any): string {
    return medico.registros
      .filter((r: any) => r.servicio !== 'SIN SERVICIO')
      .map((r: any) => r.servicio)
      .join(', ') || 'Sin servicios asignados';
  }
  
  getTotalHorarios(medico: any): number {
    return medico.registros.reduce((total: number, r: any) => total + r.horarios, 0);
  }

  getEstadisticas() {
    return {
      total: this.medicos.length,
      hombres: 0, // No tenemos el campo sexo en la estructura agrupada
      mujeres: 0
    };
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