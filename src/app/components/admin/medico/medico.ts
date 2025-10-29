import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem, ConfirmationService, MessageService } from 'primeng/api';
import { MedicoDetalle } from '../../../models/medicoDetalle.model';
import { MedicoService } from '../../../services/medico';
import { AuthService } from '../../../services/auth';

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
  medicos: MedicoDetalle[] = [];
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
    private cdr: ChangeDetectorRef
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
    
    this.medicoService.getAllMedicos().subscribe({
      next: (medicos) => {
        this.medicos = medicos;
        this.cargandoMedicos = false;
        this.cdr.detectChanges();
        console.log('✅ Médicos cargados:', this.medicos);
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

  editarMedico(idMedico: number) {
    this.router.navigate(['/admin/medicos/medico-form', idMedico]);
  }

  confirmarEliminar(medico: MedicoDetalle, event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `¿Estás seguro de que deseas eliminar al médico "${medico.usuario?.nombre} ${medico.usuario?.apellidoPaterno}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.eliminarMedico(medico);
      }
    });
  }

  eliminarMedico(medico: MedicoDetalle) {
    if (!medico.id) return;

    this.medicoService.deleteMedico(medico.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Médico eliminado',
          detail: `El médico "${medico.usuario?.nombre} ${medico.usuario?.apellidoPaterno}" fue eliminado exitosamente`,
          life: 3000
        });
        this.loadMedicos();
      },
      error: (error) => {
        console.error('❌ Error al eliminar médico:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar el médico. Puede tener citas asociadas.'
        });
      }
    });
  }

  get medicosFiltrados(): MedicoDetalle[] {
    if (!this.searchTerm.trim()) {
      return this.medicos;
    }
    
    const term = this.searchTerm.toLowerCase();
    return this.medicos.filter(medico =>
      medico.usuario?.nombre.toLowerCase().includes(term) ||
      medico.usuario?.apellidoPaterno.toLowerCase().includes(term) ||
      medico.usuario?.apellidoMaterno?.toLowerCase().includes(term) ||
      medico.usuario?.correoElectronico.toLowerCase().includes(term) ||
      medico.cedulaProfecional?.toLowerCase().includes(term) ||
      medico.servicio?.nombreServicio.toLowerCase().includes(term)
    );
  }

  getMedicoIcon(sexo: string): string {
    return sexo === 'Femenino' ? 'pi pi-female text-pink-500' : 'pi pi-male text-blue-500';
  }

  getNombreCompleto(medico: MedicoDetalle): string {
    return `Dr. ${medico.usuario?.nombre} ${medico.usuario?.apellidoPaterno} ${medico.usuario?.apellidoMaterno || ''}`.trim();
  }

  getEspecialidad(medico: MedicoDetalle): string {
    return medico.servicio?.nombreServicio || 'Sin especialidad asignada';
  }

  getEstadisticas() {
    return {
      total: this.medicos.length,
      hombres: this.medicos.filter(m => m.usuario?.sexo === 'Masculino').length,
      mujeres: this.medicos.filter(m => m.usuario?.sexo === 'Femenino').length
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