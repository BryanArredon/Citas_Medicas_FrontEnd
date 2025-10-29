import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Area } from '../../models/area.model';
import { Servicio } from '../../models/servicio.model';
import { Cita } from '../../models/cita.model';
import { AreaService } from '../../services/area';
import { ServicioService } from '../../services/servicio';
import { CitaService } from '../../services/cita';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-servicio',
  standalone: false,
  templateUrl: './servicio.html',
  styleUrls: ['./servicio.css']
})
export class ServicioComponent implements OnInit {
  activeModule: string = 'servicios';
  profileMenuItems: MenuItem[] = [];
  citasPendientes: Cita[] = [];
  areaActual: Area | null = null;
  serviciosDisponibles: Servicio[] = [];
  cargandoServicios: boolean = false;
  cargandoArea: boolean = false;
  userName: string = '';
  userRole: number | null = null;
  idArea: number = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private areaService: AreaService,
    private servicioService: ServicioService,
    private citaService: CitaService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initProfileMenu();
    this.loadUserData();
    
    this.route.params.subscribe(params => {
      this.idArea = +params['idArea'];
      if (this.idArea) {
        this.loadAreaDetalle();
        this.loadServicios();
      } else {
        console.error('No se proporcionó ID de área en la ruta');
        this.router.navigate(['/areas']);
      }
    });
  }

  initProfileMenu() {
    this.profileMenuItems = [
      {
        label: 'Acceder al perfil',
        icon: 'pi pi-user',
        command: () => this.navigateTo('/perfil')
      },
      {
        label: 'Ver histórico',
        icon: 'pi pi-history',
        command: () => this.navigateTo('/historico')
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
    this.userName = localStorage.getItem('userName') || 'Usuario';
    this.userRole = this.authService.getCurrentUserRole();
  }

  loadAreaDetalle() {
    this.cargandoArea = true;
    
    this.areaService.getAreaById(this.idArea).subscribe({
      next: (area) => {
        this.areaActual = area;
        this.cargandoArea = false;
        this.cdr.detectChanges();
        console.log('Área cargada:', area);
      },
      error: (error) => {
        console.error('Error al cargar área:', error);
        this.cargandoArea = false;
        this.router.navigate(['/areas']);
      }
    });
  }

  loadServicios() {
    this.cargandoServicios = true;
    
    console.log('Cargando servicios para área ID:', this.idArea);
    
    this.servicioService.getServiciosByArea(this.idArea).subscribe({
      next: (servicios) => {
        this.serviciosDisponibles = servicios;
        this.cargandoServicios = false;
        this.cdr.detectChanges();
        console.log('Servicios cargados:', this.serviciosDisponibles);
      },
      error: (error) => {
        console.error('Error al cargar servicios:', error);
        console.error('Detalles del error:', error);
        this.cargandoServicios = false;
        // Mostrar mensaje de error al usuario
      }
    });
  }

  getPrecioFormateado(servicio: Servicio): string {
    if (!servicio.costo) return 'Consultar';
    return `$${servicio.costo.toFixed(2)} MXN`;
  }

  getDuracionFormateada(servicio: Servicio): string {
    if (!servicio.duracion) return 'No especificada';
    
    const minutos = servicio.duracion;
    if (minutos < 60) {
      return `${minutos} min`;
    } else {
      const horas = Math.floor(minutos / 60);
      const mins = minutos % 60;
      return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
    }
  }

  getDescripcion(servicio: Servicio): string {
    return servicio.descripcionServicio || 'Sin descripción disponible';
  }

  private obtenerUsuarioId(): string {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      console.warn('No se encontró ID de usuario');
      this.router.navigate(['/login']);
      return '';
    }
    return userId;
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
    this.router.navigate([`/${module}`]);
  }

  selectServicio(servicioId: number) {
    console.log('Navegando al servicio:', servicioId);
    this.router.navigate([`/servicios/${servicioId}/medicos`]);
  }

  volverAreas() {
    this.router.navigate(['/areas']);
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
      'Odontología': 'pi-tooth'
    };
    return icons[nombreArea] || 'pi-building';
  }

  getServicioIcon(nombreServicio: string): string {
    const icons: { [key: string]: string } = {
      'Consulta': 'pi-file-edit',
      'Examen': 'pi-search',
      'Cirugía': 'pi-user-edit',
      'Tratamiento': 'pi-heart',
      'Análisis': 'pi-chart-line',
      'Diagnóstico': 'pi-check-circle',
      'Revisión': 'pi-eye',
      'Terapia': 'pi-star',
      'Limpieza': 'pi-shield',
      'Electrocardiograma': 'pi-heart',
      'Radiografía': 'pi-image'
    };
    
    for (const [key, icon] of Object.entries(icons)) {
      if (nombreServicio.toLowerCase().includes(key.toLowerCase())) {
        return icon;
      }
    }
    return 'pi-briefcase';
  }
}