import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Area } from '../../models/area.model';
import { Cita } from '../../models/cita.model';
import { AreaService } from '../../services/area';
import { CitaService } from '../../services/cita';

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

  constructor(
    private router: Router, 
    private areaService: AreaService,
    private citaService: CitaService // Inyectar el servicio
  ) {}

  ngOnInit() {
    this.initProfileMenu();
    this.loadCitasPendientes();
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
        label: 'Ver histórico',
        icon: 'pi pi-history',
        command: () => this.navigateTo('/historico')
      }
    ];
  }

  loadCitasPendientes() {
    this.cargandoCitas = true;
    
    // Obtener el ID del usuario logueado (ajusta según tu implementación)
    const usuarioId = this.obtenerUsuarioId();
    
    // Llamar al servicio para obtener las citas próximas con límite (ej: 5 citas)
    this.citaService.getCitasProximasConLimite(usuarioId, 5).subscribe({
      next: (citas: Cita[]) => {
        this.citasPendientes = citas;
        this.cargandoCitas = false;
        console.log('Citas cargadas:', citas);
      },
      error: (error: any) => {
        console.error('Error al cargar citas:', error);
        this.cargandoCitas = false;
        // Puedes mostrar un mensaje de error al usuario si lo deseas
      }
    });
  }

  // Método para obtener el ID del usuario (ajusta según tu implementación)
  private obtenerUsuarioId(): number {
    console.warn('Usando ID de usuario temporal. Implementa obtenerUsuarioId()');
    return 2; // ID hardcodeado para pruebas
  }

  loadAreas() {
    this.areaService.getAreas().subscribe(areas => {
      this.areasDisponibles = areas.filter(a => a.estatus);
    });
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  selectModule(module: string) {
    this.activeModule = module;
    this.router.navigate([`/${module}`]);
  }

  selectArea(areaId: number) {
    this.router.navigate([`/areas/${areaId}`]);
  }

  formatDate(fechaStr: string): string {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  }

  formatTime(fechaStr: string): string {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  getDaysUntil(fechaStr: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(fechaStr);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Método actualizado para obtener nombre del médico
  getNombreCompletoMedico(cita: Cita): string {
    if (!cita.medicoDetalle?.usuario) return 'Médico no asignado';
    
    const usuario = cita.medicoDetalle.usuario;
    return `Dr. ${usuario.nombre} ${usuario.apellidoPaterno} ${usuario.apellidoMaterno || ''}`.trim();
  }

  // Método para obtener el nombre del servicio
  getNombreServicio(cita: Cita): string {
    return cita.servicio?.nombreServicio || 'Servicio no especificado';
  }

  // Método para obtener el nombre del área
  getNombreArea(cita: Cita): string {
    return cita.servicio?.area?.nombreArea || 'Área no especificada';
  }

  // Método para obtener el estatus de la cita
  getEstatusCita(cita: Cita): string {
    return cita.estatus?.nombre || 'Estatus desconocido';
  }

  // Método para obtener clase CSS según estatus
  getClaseEstatus(estatus: string): string {
    const estatusMap: { [key: string]: string } = {
      'Aprobada': 'estatus-aprobada',
      'En proceso': 'estatus-en-proceso',
      'Pospuesta': 'estatus-pospuesta',
      'Pendiente': 'estatus-pendiente'
    };
    return estatusMap[estatus] || 'estatus-default';
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
      'Odontología': 'pi-smile'
    };
    return icons[nombreArea] || 'pi-building';
  }

  // Método para recargar citas
  recargarCitas(): void {
    this.loadCitasPendientes();
  }
}