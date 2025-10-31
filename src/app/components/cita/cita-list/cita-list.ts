import { Component, OnInit } from '@angular/core';
import { CitaService } from '../../../services/cita';
import { AuthService } from '../../../services/auth';
import { Cita } from '../../../models/cita.model';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cita-list',
  templateUrl: './cita-list.html',
  styleUrl: './cita-list.css',
  standalone: false,
  providers: [MessageService]
})
export class CitaList implements OnInit {

  citas: Cita[] = [];
  citasPendientes: Cita[] = [];
  citasCompletadas: Cita[] = [];
  cargando: boolean = false;
  userName: string = '';
  activeTab: string = 'pendientes';

  constructor(
    private citaService: CitaService,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.loadCitas();
  }

  loadUserData() {
    this.userName = localStorage.getItem('userName') || 'Usuario';
  }

  loadCitas() {
    this.cargando = true;
    const userId = localStorage.getItem('userId');

    if (!userId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.'
      });
      this.cargando = false;
      return;
    }

    this.citaService.getCitasProximas(+userId).subscribe({
      next: (citas) => {
        this.citas = citas;
        this.filtrarCitas();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error cargando citas:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las citas'
        });
        this.cargando = false;
      }
    });
  }

  filtrarCitas() {
    this.citasPendientes = this.citas.filter(cita =>
      cita.estatus?.nombre?.toLowerCase() === 'pendiente' ||
      cita.estatus?.nombre?.toLowerCase() === 'confirmada'
    );

    this.citasCompletadas = this.citas.filter(cita =>
      cita.estatus?.nombre?.toLowerCase() === 'completada' ||
      cita.estatus?.nombre?.toLowerCase() === 'cancelada'
    );
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  getCitasActivas(): Cita[] {
    return this.activeTab === 'pendientes' ? this.citasPendientes : this.citasCompletadas;
  }

  formatDate(fechaStr: string): string {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(fechaStr: string): string {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getNombreCompletoMedico(cita: Cita): string {
    if (!cita.medicoDetalle?.usuario) return 'Médico no asignado';
    const usuario = cita.medicoDetalle.usuario;
    return `Dr. ${usuario.nombre} ${usuario.apellidoPaterno} ${usuario.apellidoMaterno || ''}`.trim();
  }

  getDaysUntilAppointment(cita: Cita): number {
    if (!cita.agenda?.fecha) return 0;
    const appointmentDate = new Date(cita.agenda.fecha);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    appointmentDate.setHours(0, 0, 0, 0);
    const diffTime = appointmentDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getStatusColor(cita: Cita): string {
    const status = cita.estatus?.nombre?.toLowerCase();
    switch (status) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'confirmada': return 'bg-blue-100 text-blue-800';
      case 'completada': return 'bg-green-100 text-green-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
