import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem, ConfirmationService, MessageService } from 'primeng/api';
import { Servicio } from '../../../models/servicio.model';
import { ServicioService } from '../../../services/servicio';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-admin-servicios',
  standalone: false,
  templateUrl: './servicio.html',
  styleUrls: ['./servicio.css'],
  providers: [ConfirmationService, MessageService],

})
export class AdminServicioComponent implements OnInit {
  activeModule: string = 'servicios';
  profileMenuItems: MenuItem[] = [];
  servicios: Servicio[] = [];
  cargandoServicios: boolean = false;
  userName: string = '';
  userRole: number | null = null;
  searchTerm: string = '';

  constructor(
    private router: Router,
    private servicioService: ServicioService,
    public authService: AuthService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initProfileMenu();
    this.loadUserData();
    this.loadServicios();
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

  loadServicios() {
    this.cargandoServicios = true;
    
    this.servicioService.getAllServicios().subscribe({
      next: (servicios) => {
        this.servicios = servicios;
        this.cargandoServicios = false;
        this.cdr.detectChanges();
        console.log('Servicios cargados:', this.servicios);
      },
      error: (error) => {
        console.error('Error al cargar servicios:', error);
        this.cargandoServicios = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las áreas'
        });
      }
    });
  }

  agregarServicio() {
    this.router.navigate(['/admin/servicios/servicio-form']);
  }

  editarServicio(idServicio: number) {
    this.router.navigate(['/admin/servicios/servicio-form/', idServicio]);
  }

  confirmarEliminar(servicio: Servicio, event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `¿Estás seguro de que deseas eliminar el servicio "${servicio.nombreServicio}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.eliminarServicio(servicio);
      }
    });
  }

  eliminarServicio(servicio: Servicio) {
    if (!servicio.id) return;

    this.servicioService.deleteServicio(servicio.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Servicio eliminado',
          detail: `El servicio "${servicio.nombreServicio}" fue eliminado exitosamente`,
          life: 3000
        });
        this.loadServicios();
      },
      error: (error) => {
        console.error('Error al eliminar servicio:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar el servicio. Puede tener medicos asociados.'
        });
      }
    });
  }

  get serviciosFiltrados(): Servicio[] {
    if (!this.searchTerm.trim()) {
      return this.servicios;
    }
    
    const term = this.searchTerm.toLowerCase();
    return this.servicios.filter(servicio =>
      servicio.nombreServicio.toLowerCase().includes(term) ||
      servicio.descripcionServicio?.toLowerCase().includes(term)
    );
  }

  getServicioIcon(nombreServicio: string): string {
    const icons: { [key: string]: string } = {
      // Cardiología (Área 1)
      'Consulta de Cardiología': 'pi-heart',
      'Electrocardiograma': 'pi-wave-pulse',
      'Prueba de Esfuerzo': 'pi-stopwatch',
      'Ecocardiograma': 'pi-chart-line',

      // Oftalmología (Área 2)
      'Consulta Oftalmológica': 'pi-eye',
      'Examen de la Vista': 'pi-glasses',
      'Tonometría': 'pi-gauge',
      'Cirugía LASIK': 'pi-sparkles',

      // Pediatría (Área 3)
      'Consulta Pediátrica': 'pi-user',
      'Control del Niño Sano': 'pi-users',
      'Vacunación': 'pi-injection',
      'Valoración del Desarrollo': 'pi-baby',

      // Dermatología (Área 4)
      'Consulta Dermatológica': 'pi-sun',
      'Biopsia de Piel': 'pi-eyedropper',
      'Terapia con Láser': 'pi-bolt',
      'Tratamiento para Acné': 'pi-face-smile',

      // Traumatología (Área 5)
      'Consulta Traumatológica': 'pi-shield',
      'Radiografía': 'pi-camera',
      'Resonancia Articular': 'pi-magnet',
      'Colocación de Yeso': 'pi-box',

      // Odontología (Área 6)
      'Consulta Odontológica': 'pi-user',
      'Limpieza dental': 'pi-sparkles',
      'Curación Dental': 'pi-wrench',
      'Extracción Dental': 'pi-times-circle',
      'Ortodoncia': 'pi-align-center',
      'Profilaxis Dental': 'pi-sparkles'
    };

    return icons[nombreServicio] || 'pi-briefcase'; // ícono por defecto
  }


  getEstadisticas() {
    return {
      total: this.servicios.length,
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