import { ChangeDetectorRef, Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { isPlatformBrowser } from '@angular/common';
import { Area } from '../../models/area.model';
import { AreaService } from '../../services/area';
// Update the path below to the correct location of your AuthService
import { AuthService, AuthResponse } from '../../services/auth';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class HomeComponent implements OnInit {
  areasDisponibles: Area[] = [];
  cargandoAreas: boolean = false;
  userName: string = '';
  profileMenuItems: MenuItem[] = [];
  activeModule: string = 'home';
  citasPendientes: any[] = []; // Update type if integrating CitaService

  constructor(
    private router: Router,
    private areaService: AreaService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
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
        command: () => this.navigateTo('/perfil'),
      },
      {
        label: 'Ver histórico',
        icon: 'pi pi-history',
        command: () => this.navigateTo('/historico'),
      },
      {
        separator: true,
      },
      {
        label: 'Cerrar sesión',
        icon: 'pi pi-sign-out',
        command: () => this.logout(),
      },
    ];
  }

  loadUserData() {
    if (isPlatformBrowser(this.platformId)) {
      this.userName = localStorage.getItem('userName') || 'Usuario';
    }
  }

  loadAreas() {
    this.cargandoAreas = true;
    this.areaService.getAreas().subscribe({
      next: (areas) => {
        this.areasDisponibles = areas.filter((a) => a.estatus);
        this.cargandoAreas = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar áreas:', error);
        this.cargandoAreas = false;
      },
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

  selectArea(areaId: number) {
    this.router.navigate([`/areas/${areaId}`]);
  }

  getAreaIcon(nombreArea: string): string {
    const icons: { [key: string]: string } = {
      Cardiología: 'pi pi-heart-fill',
      Oftalmología: 'pi pi-eye',
      Pediatría: 'pi pi-users',
      Dermatología: 'pi pi-sun',
      Traumatología: 'pi pi-shield',
      'Medicina General': 'pi pi-briefcase',
      Ginecología: 'pi pi-heart',
      Neurología: 'pi pi-star',
      Odontología: 'pi pi-user',
    };
    return icons[nombreArea] || 'pi pi-building';
  }

  getUserRoleText(): string {
    const role = this.authService.getCurrentUserRole();
    if (role === 3) return 'Administrador';
    if (role === 2) return 'Médico';
    if (role === 1) return 'Paciente';
    return 'Usuario';
  }
}