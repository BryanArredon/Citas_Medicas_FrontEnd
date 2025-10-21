import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistorialClinicoService } from '../../services/historial-clinico.service';
import { HistorialClinico } from '../../models/historial.model';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { Menu } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [
    CommonModule,
    MenuModule,
    ButtonModule,
    CardModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    DatePickerModule,
    FormsModule
  ],
  templateUrl: './historial.html',
  styleUrl: './historial.css'
})
export class Historial implements OnInit {
  historiales: HistorialClinico[] = [];
  loading: boolean = false;

  // Propiedades para el navbar moderno
  activeModule: string = 'historial';
  userName: string = '';
  userRole: number = 0;

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

  // Modal para crear/editar historial
  modalAbierto: boolean = false;
  esEdicion: boolean = false;
  historialSeleccionado: HistorialClinico = {};

  @ViewChild('menu') menu!: Menu;

  constructor(
    private historialService: HistorialClinicoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadHistoriales();
  }

  loadUserInfo() {
    const userName = localStorage.getItem('userName') || localStorage.getItem('userEmail') || 'Usuario';
    const userRole = localStorage.getItem('userRole');
    this.userName = userName.split('@')[0];
    this.userRole = userRole ? Number(userRole) : 0;
  }

  loadHistoriales(): void {
    this.loading = true;
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');

    if (userId) {
      setTimeout(() => {
        if (userRole === '2') { // Médico
          this.historialService.getHistorialClinicoByMedico(Number(userId)).subscribe({
            next: (historiales) => {
              this.historiales = historiales;
              this.loading = false;
              console.log('Historiales cargados para médico:', historiales);
            },
            error: (error) => {
              console.error('Error al cargar historiales del médico:', error);
              this.loading = false;
            }
          });
        } else if (userRole === '3') { // Paciente
          this.historialService.getHistorialClinicoByPaciente(Number(userId)).subscribe({
            next: (historiales) => {
              this.historiales = historiales;
              this.loading = false;
              console.log('Historiales cargados para paciente:', historiales);
            },
            error: (error) => {
              console.error('Error al cargar historiales del paciente:', error);
              this.loading = false;
            }
          });
        } else {
          // Para otros roles, cargar todos (admin)
          this.historialService.getAllHistorialClinico().subscribe({
            next: (historiales) => {
              this.historiales = historiales;
              this.loading = false;
              console.log('Todos los historiales cargados:', historiales);
            },
            error: (error) => {
              console.error('Error al cargar todos los historiales:', error);
              this.loading = false;
            }
          });
        }
      }, 100);
    } else {
      console.error('No se encontró ID del usuario');
      this.loading = false;
    }
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
      case 'historial':
        // Ya estamos aquí
        break;
    }
  }

  abrirModalCrear() {
    this.esEdicion = false;
    this.historialSeleccionado = {
      fecha: new Date().toISOString().split('T')[0]
    };
    this.modalAbierto = true;
  }

  abrirModalEditar(historial: HistorialClinico) {
    this.esEdicion = true;
    this.historialSeleccionado = { ...historial };
    this.modalAbierto = true;
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.historialSeleccionado = {};
  }

  guardarHistorial() {
    if (this.esEdicion && this.historialSeleccionado.id) {
      this.historialService.updateHistorialClinico(this.historialSeleccionado.id, this.historialSeleccionado).subscribe({
        next: (historialActualizado) => {
          const index = this.historiales.findIndex(h => h.id === historialActualizado.id);
          if (index !== -1) {
            this.historiales[index] = historialActualizado;
          }
          this.cerrarModal();
        },
        error: (error) => {
          console.error('Error al actualizar historial:', error);
          alert('Error al actualizar el historial clínico');
        }
      });
    } else {
      this.historialService.createHistorialClinico(this.historialSeleccionado).subscribe({
        next: (nuevoHistorial) => {
          this.historiales.unshift(nuevoHistorial);
          this.cerrarModal();
        },
        error: (error) => {
          console.error('Error al crear historial:', error);
          alert('Error al crear el historial clínico');
        }
      });
    }
  }

  eliminarHistorial(historial: HistorialClinico) {
    if (historial.id && confirm('¿Está seguro de que desea eliminar este historial clínico?')) {
      this.historialService.deleteHistorialClinico(historial.id).subscribe({
        next: () => {
          this.historiales = this.historiales.filter(h => h.id !== historial.id);
        },
        error: (error) => {
          console.error('Error al eliminar historial:', error);
          alert('Error al eliminar el historial clínico');
        }
      });
    }
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/home']);
  }

  // Método helper para obtener el nombre completo del paciente
  getNombrePaciente(historial: HistorialClinico): string {
    if (historial.paciente?.usuario) {
      const { nombre, apellidoPaterno, apellidoMaterno } = historial.paciente.usuario;
      return `${nombre || ''} ${apellidoPaterno || ''} ${apellidoMaterno || ''}`.trim();
    }
    return 'Paciente no especificado';
  }

  // Método helper para obtener el nombre completo del médico
  getNombreMedico(historial: HistorialClinico): string {
    if (historial.medico?.usuario) {
      const { nombre, apellidoPaterno, apellidoMaterno } = historial.medico.usuario;
      return `${nombre || ''} ${apellidoPaterno || ''} ${apellidoMaterno || ''}`.trim();
    }
    return 'Médico no especificado';
  }
}
