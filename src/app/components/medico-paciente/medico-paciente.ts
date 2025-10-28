import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { Area } from '../../models/area.model';
import { Servicio } from '../../models/servicio.model';
import { MedicoDetalle } from '../../models/medicoDetalle.model';
import { Cita } from '../../models/cita.model';
import { AreaService } from '../../services/area';
import { ServicioService } from '../../services/servicio';
import { MedicoService } from '../../services/medico';
import { CitaService } from '../../services/cita';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-medico',
  standalone: false,
  templateUrl: './medico-paciente.html',
  styleUrls: ['./medico-paciente.css'],
  providers: [MessageService]
})
export class MedicosComponent implements OnInit {
  activeModule: string = 'medicos';
  profileMenuItems: MenuItem[] = [];
  citasPendientes: Cita[] = [];
  areaActual: Area | null = null;
  servicioActual: Servicio | null = null;
  medicosDisponibles: MedicoDetalle[] = [];
  cargandoMedicos: boolean = false;
  cargandoServicio: boolean = false;
  userName: string = '';
  userRole: number | null = null;
  idServicio: number = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private areaService: AreaService,
    private servicioService: ServicioService,
    private medicoService: MedicoService,
    private citaService: CitaService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
  ) {}

  ngOnInit() {
    this.initProfileMenu();
    this.loadUserData();
    this.loadCitasPendientes();
    
    // Obtener el ID del servicio desde la ruta
    this.route.params.subscribe(params => {
      this.idServicio = +params['servicioId'];
      if (this.idServicio) {
        this.loadServicioDetalle();
        this.loadMedicos();
      } else {
        console.error('No se proporcionó ID de servicio en la ruta');
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

  loadCitasPendientes() {
    const usuarioId = this.obtenerUsuarioId();
    if (!usuarioId) return;

    this.citaService.getCitasProximasConLimite(usuarioId, 5).subscribe({
      next: (citas: Cita[]) => {
        this.citasPendientes = citas;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error al cargar citas:', error);
      }
    });
  }

  loadServicioDetalle() {
    this.cargandoServicio = true;
    
    this.servicioService.getServicioById(this.idServicio).subscribe({
      next: (servicio) => {
        this.servicioActual = servicio;
        // Cargar el área del servicio
        if (servicio.area?.id) {
          this.areaActual = servicio.area;
        } else if (servicio.idArea) {
          this.loadAreaDelServicio(servicio.idArea);
        }
        this.cargandoServicio = false;
        this.cdr.detectChanges();
        console.log('Servicio cargado:', servicio);
      },
      error: (error) => {
        console.error('Error al cargar servicio:', error);
        this.cargandoServicio = false;
        this.router.navigate(['/areas']);
      }
    });
  }

  loadAreaDelServicio(idArea: number) {
    this.areaService.getAreaById(idArea).subscribe({
      next: (area) => {
        this.areaActual = area;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar área:', error);
      }
    });
  }

  loadMedicos() {
    this.cargandoMedicos = true;
    
    console.log('Cargando médicos para servicio ID:', this.idServicio);
    
    this.medicoService.getMedicosByServicio(this.idServicio).subscribe({
      next: (medicos) => {
        this.medicosDisponibles = medicos;
        this.cargandoMedicos = false;
        this.cdr.detectChanges();
        console.log('Médicos cargados:', this.medicosDisponibles);
      },
      error: (error) => {
        console.error('Error al cargar médicos:', error);
        console.error('Detalles del error:', error);
        this.cargandoMedicos = false;
      }
    });
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

  // En medicos.component.ts - modifica el método selectMedico
selectMedico(medico: MedicoDetalle) {
  console.log('Médico seleccionado:', medico);
  
  if (!medico || !medico.id) {
    console.error('Médico no válido');
    return;
  }

  if (!this.servicioActual || !this.idServicio) {
    console.error('Servicio no disponible');
    return;
  }

  // Obtener el userId del localStorage
  const userId = localStorage.getItem('userId');
  console.log('UserId obtenido:', userId);

  if (!userId) {
    console.error('No se encontró userId en localStorage');
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.'
    });
    return;
  }

  // Guardar en localStorage para persistencia
  localStorage.setItem('medicoSeleccionado', JSON.stringify(medico));
  localStorage.setItem('servicioSeleccionado', JSON.stringify(this.servicioActual));
  localStorage.setItem('userId', userId); // Asegurar que esté presente

  console.log('Navegando a cita-forms con:', {
    medicoId: medico.id,
    servicioId: this.idServicio,
    userId: userId
  });

  // Navegar a la pantalla de citas con el userId en queryParams
  this.router.navigate(['/cita-forms'], {
    queryParams: {
      medicoId: medico.id,
      servicioId: this.idServicio,
      userId: userId // Agregar userId aquí
    }
  }).then(success => {
    if (!success) {
      console.error('Error en navegación a cita-forms');
    }
  });
}

  volverServicios() {
    if (this.areaActual?.id) {
      this.router.navigate([`/areas/${this.areaActual.id}`]);
    } else {
      this.router.navigate(['/areas']);
    }
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

  getNombreCompletoMedico(medico: MedicoDetalle): string {
    if (!medico.usuario) return 'Nombre no disponible';
    const usuario = medico.usuario;
    return `Dr. ${usuario.nombre} ${usuario.apellidoPaterno} ${usuario.apellidoMaterno || ''}`.trim();
  }

  getCedulaMedico(medico: MedicoDetalle): string {
    return medico.cedulaProfecional || 'No disponible';
  }

  getIniciales(medico: MedicoDetalle): string {
    if (!medico.usuario) return 'Dr';
    const nombre = medico.usuario.nombre?.charAt(0) || '';
    const apellido = medico.usuario.apellidoPaterno?.charAt(0) || '';
    return (nombre + apellido).toUpperCase() || 'Dr';
  }

  getDuracionFormateada(): string {
    if (!this.servicioActual?.duracion) return 'No especificada';
    
    const minutos = this.servicioActual.duracion;
    if (minutos < 60) {
      return `${minutos} min`;
    } else {
      const horas = Math.floor(minutos / 60);
      const mins = minutos % 60;
      return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
    }
  }

  getPrecioFormateado(): string {
    if (!this.servicioActual?.costo) return 'Consultar';
    return `$${this.servicioActual.costo.toFixed(2)} MXN`;
  }

  getMedicoSeleccionado(): number | null {
  const medico = localStorage.getItem('medicoSeleccionado');
  return medico ? JSON.parse(medico).idMedicoDetalle : null;
}

getServicioSeleccionado(): number | null {
  const servicio = localStorage.getItem('servicioSeleccionado');
  return servicio ? JSON.parse(servicio).idServicio : null;
}

limpiarSeleccion() {
  localStorage.removeItem('medicoSeleccionado');
  localStorage.removeItem('servicioSeleccionado');
}
}