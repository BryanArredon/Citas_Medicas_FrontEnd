import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem, ConfirmationService, MessageService } from 'primeng/api';
import { Area } from '../../../models/area.model';
import { AreaService } from '../../../services/area';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-admin-areas',
  standalone: false,
  templateUrl: './area.html',
  styleUrls: ['./area.css'],
  providers: [ConfirmationService, MessageService],

})
export class AdminAreasComponent implements OnInit {
  activeModule: string = 'areas';
  profileMenuItems: MenuItem[] = [];
  areas: Area[] = [];
  cargandoAreas: boolean = false;
  userName: string = '';
  userRole: number | null = null;
  searchTerm: string = '';

  constructor(
    private router: Router,
    private areaService: AreaService,
    public authService: AuthService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initProfileMenu();
    this.loadUserData();
    this.loadAreas();
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

  loadAreas() {
    this.cargandoAreas = true;
    
    this.areaService.getAreas().subscribe({
      next: (areas) => {
        this.areas = areas;
        this.cargandoAreas = false;
        this.cdr.detectChanges();
        console.log('Áreas cargadas:', this.areas);
      },
      error: (error) => {
        console.error('Error al cargar áreas:', error);
        this.cargandoAreas = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las áreas'
        });
      }
    });
  }

  agregarArea() {
    this.router.navigate(['/admin/areas/area-form']);
  }

  editarArea(idArea: number) {
    this.router.navigate([`/admin/areas/area-form/${idArea}`]);
  }

  confirmarEliminar(area: Area, event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `¿Estás seguro de que deseas eliminar el área "${area.nombreArea}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.eliminarArea(area);
      }
    });
  }

  eliminarArea(area: Area) {
    if (!area.id) return;

    this.areaService.deleteArea(area.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Área eliminada',
          detail: `El área "${area.nombreArea}" fue eliminada exitosamente`,
          life: 3000
        });
        this.loadAreas();
      },
      error: (error) => {
        console.error('Error al eliminar área:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar el área. Puede tener servicios asociados.'
        });
      }
    });
  }

  get areasFiltradas(): Area[] {
    if (!this.searchTerm.trim()) {
      return this.areas;
    }
    
    const term = this.searchTerm.toLowerCase();
    return this.areas.filter(area =>
      area.nombreArea.toLowerCase().includes(term) ||
      area.descripcion?.toLowerCase().includes(term)
    );
  }

  getAreaIcon(nombreArea: string): string {
    const icons: { [key: string]: string } = {
      'Cardiología': 'pi-heart-fill',
      'Oftalmología': 'pi-eye',
      'Pediatría': 'pi-users',
      'Dermatología': 'pi-sun',
      'Traumatología': 'pi-shield',
      'Medicina General': 'pi-briefcase',
      'Ginecología': 'pi-heart',
      'Neurología': 'pi-star',
      'Odontología': 'pi-user'
    };
    return icons[nombreArea] || 'pi-building';
  }

  getEstadisticas() {
    return {
      total: this.areas.length,
      activas: this.areas.filter(a => a.estatus).length,
      inactivas: this.areas.filter(a => !a.estatus).length
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