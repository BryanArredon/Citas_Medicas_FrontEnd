import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgendaService } from '../../../services/agenda';
import { Agenda } from '../../../models/agenda.model';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { Menu } from 'primeng/menu';

@Component({
  selector: 'app-agenda-medico',
  standalone: true,
  imports: [CommonModule, MenuModule],
  templateUrl: './agenda-medico.html',
  styleUrl: './agenda-medico.css'
})
export class AgendaMedico implements OnInit {
  agendas: Agenda[] = [];
  loading: boolean = false;

  // Nuevas propiedades para el navbar moderno
  activeModule: string = 'medicos';
  userName: string = '';

  profileMenuItems: MenuItem[] = [
    {
      label: 'Mi Perfil',
      icon: 'pi pi-user',
      command: () => this.router.navigate(['/account'])
    },
    {
      label: 'Cerrar Sesión',
      icon: 'pi pi-sign-out',
      command: () => this.logout()
    }
  ];

  @ViewChild('menu') menu!: Menu;

  constructor(
    private agendaService: AgendaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadAgendas();
  }

  loadUserInfo() {
    const userName = localStorage.getItem('userName') || localStorage.getItem('userEmail') || 'Usuario';
    this.userName = userName.split('@')[0]; // Remover dominio del email si existe
  }

  loadAgendas(): void {
    this.loading = true;
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');

    // Pequeño retraso para mostrar el mensaje de carga
    setTimeout(() => {
      if (userId && userRole === '2') { // Rol 2 = Médico
        this.agendaService.getAgendasByMedico(Number(userId)).subscribe({
          next: (agendas) => {
            this.agendas = agendas;
            this.loading = false;
            console.log('Agendas cargadas para médico:', agendas);
          },
          error: (error) => {
            console.warn('No se pudieron cargar agendas específicas del médico, intentando método alternativo:', error);
            // Si falla, intentar método alternativo
            this.loadAgendasAlternative();
          }
        });
      } else {
        console.error('No se encontró información del médico logueado');
        this.loading = false;
      }
    }, 100); // 800ms de retraso para mostrar el mensaje amigable
  }

  private loadAgendasAlternative(): void {
    // Método alternativo: obtener todas las agendas
    // Esto es útil para desarrollo/testing cuando no hay datos específicos
    setTimeout(() => {
      this.agendaService.getAllAgendas().subscribe({
        next: (allAgendas) => {
          // Para desarrollo, mostrar todas las agendas
          // En producción, podrías filtrar por médico si es necesario
          this.agendas = allAgendas;
          this.loading = false;
          console.log('Agendas cargadas (método alternativo):', this.agendas);
        },
        error: (error) => {
          console.error('Error al cargar agendas alternativas:', error);
          this.agendas = []; // Asegurar que sea un array vacío
          this.loading = false;
        }
      });
    }, 500); // Menos retraso para el método alternativo
  }

  selectModule(module: string) {
    this.activeModule = module;
    switch (module) {
      case 'areas':
        this.router.navigate(['/areas']);
        break;
      case 'servicios':
        this.router.navigate(['/servicios']);
        break;
      case 'medicos':
        this.router.navigate(['/medicos']);
        break;
      case 'mis-citas':
        this.router.navigate(['/cita-list']);
        break;
    }
  }

  volverAHorarios(): void {
    this.router.navigate(['/medicos']);
  }

  getCitasHoy(): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return this.agendas.filter(agenda => {
      const fechaCita = new Date(agenda.fecha);
      fechaCita.setHours(0, 0, 0, 0);
      return fechaCita.getTime() === hoy.getTime();
    }).length;
  }

  getCitasSemana(): number {
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);

    return this.agendas.filter(agenda => {
      const fechaCita = new Date(agenda.fecha);
      return fechaCita >= inicioSemana && fechaCita <= finSemana;
    }).length;
  }

  getCitasProximas(): number {
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);

    const enUnaSemana = new Date(hoy);
    enUnaSemana.setDate(hoy.getDate() + 7);

    return this.agendas.filter(agenda => {
      const fechaCita = new Date(agenda.fecha);
      return fechaCita > hoy && fechaCita <= enUnaSemana;
    }).length;
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/home']);
  }
}
