import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Area } from '../../models/area.model';
import { Cita } from '../../models/cita.model';
import { AreaService } from '../../services/area';
import { CitaService } from '../../services/cita';
import { AuthService } from '../../services/auth';
import { combineDateAndTime, parseServerDateToLocal } from '../../utils/date-utils';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './area.html',
  styleUrls: ['./area.css']
})
export class AreaComponent implements OnInit {
  activeModule: string = 'areas';
  profileMenuItems: MenuItem[] = [];
  citasPendientes: Cita[] = [];
  areasDisponibles: Area[] = [];
  cargandoCitas: boolean = false;
  cargandoAreas: boolean = false;
  userName: string = '';
  userRole: number | null = null;

  constructor(
    private router: Router, 
    private areaService: AreaService,
    private citaService: CitaService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initProfileMenu();
    this.loadUserData();
    this.loadCitasPendientes();
    this.loadAreas();
  }

  initProfileMenu() {
    this.profileMenuItems = [
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
    console.log('Usuario logeado:', {
      id: this.obtenerUsuarioId(),
      nombre: this.userName,
      rol: this.userRole
    });
  }

  loadCitasPendientes() {
    const usuarioId = this.obtenerUsuarioId();
    
    if (!usuarioId) {
      console.error('No se pudo obtener el ID del usuario');
      this.router.navigate(['/login']);
      return;
    }

    this.cargandoCitas = true;
    
    console.log('Cargando citas para usuario ID:', usuarioId);
    
    this.citaService.getCitasProximasConLimite(usuarioId, 2).subscribe({
      next: (citas: Cita[]) => {
        this.citasPendientes = citas;
        this.cargandoCitas = false;
        this.cdr.detectChanges();
        console.log('Citas cargadas:', citas);
      },
      error: (error: any) => {
        console.error('Error al cargar citas:', error);
        this.cargandoCitas = false;
      }
    });
  }

  // Método para obtener el ID del usuario desde localStorage
  private obtenerUsuarioId(): string {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      console.warn('No se encontró ID de usuario en localStorage');
      this.router.navigate(['/login']);
      return '';
    }
    
    return userId;
  }

  loadAreas() {
    this.cargandoAreas = true;
    
    this.areaService.getAreas().subscribe({
      next: (areas) => {
        this.areasDisponibles = areas.filter(a => a.estatus);
        this.cargandoAreas = false;
        this.cdr.detectChanges();
        console.log('Áreas cargadas:', this.areasDisponibles);
      },
      error: (error) => {
        console.error('Error al cargar áreas:', error);
        this.cargandoAreas = false;
      }
    });
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

  navigateToCitaForm() {
    this.router.navigate(['/cita-forms']);
  }


  navigateToCitaList() {
    this.router.navigate(['/cita-list']);
  }
  selectArea(areaId: number) {
    console.log('Navegando al área:', areaId);
    this.router.navigate([`/areas/${areaId}`]);
  }

  formatDate(fechaStr: string): string {
    const fecha = parseServerDateToLocal(fechaStr);
    if (isNaN(fecha.getTime())) return 'Fecha inválida';
    return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  formatTime(fechaStr: string): string {
    const fecha = parseServerDateToLocal(fechaStr);
    if (isNaN(fecha.getTime())) return '--:--';
    return fecha.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  getDaysUntil(fechaStr: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = parseServerDateToLocal(fechaStr);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getAppointmentDate(cita: Cita): Date {
  const agendaFechaRaw = cita?.agenda?.fecha;
  const horaInicioRaw = cita?.agenda?.horaInicio;

  if (agendaFechaRaw && horaInicioRaw) {
    return combineDateAndTime(agendaFechaRaw, horaInicioRaw);
  }
  
  return parseServerDateToLocal(cita?.fechaSolicitud);
}

  formatDateFromAppointment(cita: Cita): string {
    const fecha = this.getAppointmentDate(cita);
    if (isNaN(fecha.getTime())) return 'Fecha inválida';
    return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  formatTimeFromAppointment(cita: Cita): string {
    const fecha = this.getAppointmentDate(cita);
    if (isNaN(fecha.getTime())) return '--:--';
    return fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  getDaysUntilAppointment(cita: Cita): number {
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = this.getAppointmentDate(cita);
    target.setHours(0,0,0,0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getNombreCompletoMedico(cita: Cita): string {
    if (!cita.medicoDetalle?.usuario) return 'Médico no asignado';
    
    const usuario = cita.medicoDetalle.usuario;
    return `Dr. ${usuario.nombre} ${usuario.apellidoPaterno} ${usuario.apellidoMaterno || ''}`.trim();
  }

  getNombreServicio(cita: Cita): string {
    return cita.servicio?.nombreServicio || 'Servicio no especificado';
  }

  getNombreArea(cita: Cita): string {
    return cita.servicio?.area?.nombreArea || 'Área no especificada';
  }

  getEstatusCita(cita: Cita): string {
    return cita.estatus?.nombre || 'Estatus desconocido';
  }

  getClaseEstatus(estatus: string): string {
    const estatusMap: { [key: string]: string } = {
      'Aprobada': 'estatus-aprobada',
      'En proceso': 'estatus-en-proceso',
      'Pospuesta': 'estatus-pospuesta',
      'Pendiente': 'estatus-pendiente',
      'Confirmada': 'estatus-confirmada',
      'Completada': 'estatus-completada',
      'Cancelada': 'estatus-cancelada'
    };
    return estatusMap[estatus] || 'estatus-default';
  }

  getAreaIcon(nombreArea: string): string {
    const icons: { [key: string]: string } = {
      'Cardiología': 'pi pi-heart-fill',
      'Oftalmología': 'pi pi-eye',
      'Pediatría': 'pi pi-users',
      'Dermatología': 'pi pi-sun',
      'Traumatología': 'pi pi-shield',
      'Medicina General': 'pi pi-briefcase',
      'Ginecología': 'pi pi-heart',
      'Neurología': 'pi pi-star',
      'Odontología': 'pi pi-user'
    };
    return icons[nombreArea] || 'pi pi-building';
  }

  recargarCitas(): void {
    this.loadCitasPendientes();
  }

  // Método para verificar si hay citas
  tieneCitasPendientes(): boolean {
    return this.citasPendientes && this.citasPendientes.length > 0;
  }

  // Método para verificar si está cargando
  estaCargando(): boolean {
    return this.cargandoCitas;
  }

  // Métodos para médicos
  navigateToAgendarHorario() {
    this.router.navigate(['/horarios']);
  }

  navigateToVerAgenda() {
    this.router.navigate(['/agenda-medico']);
  }

  // Método para verificar si el usuario es médico
  esMedico(): boolean {
    return this.userRole === 2;
  }
}