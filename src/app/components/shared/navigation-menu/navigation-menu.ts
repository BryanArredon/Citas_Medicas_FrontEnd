import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-navigation-menu',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  templateUrl: './navigation-menu.html',
  styleUrls: ['./navigation-menu.css']
})
export class NavigationMenuComponent {

  visible: boolean = false;

  constructor(private router: Router) { }

  showDialog() {
    this.visible = true;
  }

  navigateAndClose(action: string) {
    this.visible = false;

    switch(action) {
      case 'agendarCita':
        this.agendarCita();
        break;
      case 'verCitas':
        this.verCitas();
        break;
      case 'verHistorial':
        this.verHistorial();
        break;
      case 'verPerfil':
        this.verPerfil();
        break;
      case 'verAreas':
        this.verAreas();
        break;
      case 'verServicios':
        this.verServicios();
        break;
      case 'verMedicos':
        this.verMedicos();
        break;
    }
  }

  // Métodos específicos para rutas que requieren flujo especial
  agendarCita() {
    // Ir directamente al formulario de citas
    this.router.navigate(['/cita-forms']);
  }

  verCitas() {
    this.router.navigate(['/cita-list']);
  }

  verHistorial() {
    this.router.navigate(['/historial']);
  }

  verPerfil() {
    this.router.navigate(['/account']);
  }

  verAreas() {
    this.router.navigate(['/areas']);
  }

  verServicios() {
    this.router.navigate(['/servicios']);
  }

  verMedicos() {
    this.router.navigate(['/medicos']);
  }
}
