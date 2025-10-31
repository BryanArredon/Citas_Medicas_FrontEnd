import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AreaComponent } from './components/area/area';
import { ServicioComponent } from './components/servicio/servicio';
import { HomeComponent } from './components/home/home';
import { LoginComponent } from './components/user/login/login';
import { CreateAccount } from './components/user/create-account/create-account';
import { CitaList } from './components/cita/cita-list/cita-list';
import { Account } from './components/account/account';
import { Medico } from './components/medico/medico';
import { Historial } from './components/historial/historial';
import { AgendaMedico } from './components/medico/agenda-medico/agenda-medico';
import { AgendaMedicoCalendarComponent } from './components/medico/agenda-medico-calendar/agenda-medico-calendar.component';
import { MedicosComponent } from './components/medico-paciente/medico-paciente';
import { CitasComponent } from './components/cita/cita-form/cita-form';
import { AdminAreasComponent } from './components/admin/area/area';
import { AreaFormComponent } from './components/admin/area-form/area-form';
import { AdminServicioComponent } from './components/admin/servicio/servicio';
import { ServicioFormComponent } from './components/admin/servicio-form/servicio-form';
import { AdminMedicoComponent } from './components/admin/medico/medico';
import { MedicoFormComponent } from './components/admin/medico-form/medico-form';
import { RoleGuard } from './guards/role.guard';

const routes: Routes = [
  // ===== RUTAS PÚBLICAS =====
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home',                     component: HomeComponent },
  { path: 'login',                    component: LoginComponent },
  { path: 'create-account',           component: CreateAccount },

  // ===== RUTAS PARA TODOS LOS USUARIOS AUTENTICADOS =====
  { path: 'account',                  component: Account, canActivate: [RoleGuard], data: { roles: [1, 2, 3] } },

  // ===== RUTAS PARA PACIENTES (ROL 1) =====
  { path: 'areas',                    component: AreaComponent, canActivate: [RoleGuard], data: { roles: [1, 2, 3] } },
  { path: 'areas/:idArea',            component: ServicioComponent, canActivate: [RoleGuard], data: { roles: [1, 2, 3] } },
  { path: 'servicios',                component: ServicioComponent, canActivate: [RoleGuard], data: { roles: [1, 2, 3] } },
  { path: 'servicios/:servicioId/medicos', component: MedicosComponent, canActivate: [RoleGuard], data: { roles: [1, 2, 3] } },
  { path: 'medicos',                  component: MedicosComponent, canActivate: [RoleGuard], data: { roles: [1, 2, 3] } },
  { path: 'cita-list',                component: CitaList, canActivate: [RoleGuard], data: { roles: [1, 2, 3] } },
  { path: 'cita-forms',               component: CitasComponent, canActivate: [RoleGuard], data: { roles: [1, 2, 3] } },
  { path: 'historial',                component: Historial, canActivate: [RoleGuard], data: { roles: [1, 2, 3] } },

  // ===== RUTAS PARA MÉDICOS (ROL 2) =====
  { path: 'medico-home',              redirectTo: '/agenda-medico', pathMatch: 'full' },
  { path: 'agenda-medico',            component: AgendaMedico, canActivate: [RoleGuard], data: { roles: [2, 3] } },
  { path: 'agenda-calendar',          component: AgendaMedicoCalendarComponent, canActivate: [RoleGuard], data: { roles: [2, 3] } },
  { path: 'horarios',                 component: Medico, canActivate: [RoleGuard], data: { roles: [2, 3] } },
  { path: 'historial-clinico',        component: Historial, canActivate: [RoleGuard], data: { roles: [2, 3] } },

  // ===== RUTAS PARA ADMINISTRADORES (ROL 3) =====
  { path: 'admin/areas',              component: AdminAreasComponent, canActivate: [RoleGuard], data: { roles: [3] } },
  { path: 'admin/areas/area-form',    component: AreaFormComponent, canActivate: [RoleGuard], data: { roles: [3] } },
  { path: 'admin/areas/area-form/:id', component: AreaFormComponent, canActivate: [RoleGuard], data: { roles: [3] } },
  { path: 'admin/servicios',          component: AdminServicioComponent, canActivate: [RoleGuard], data: { roles: [3] } },
  { path: 'admin/servicios/servicio-form', component: ServicioFormComponent, canActivate: [RoleGuard], data: { roles: [3] } },
  { path: 'admin/servicios/servicio-form/:id', component: ServicioFormComponent, canActivate: [RoleGuard], data: { roles: [3] } },
  { path: 'admin/medicos',            component: AdminMedicoComponent, canActivate: [RoleGuard], data: { roles: [3] } },
  { path: 'admin/medicos/medico-form', component: MedicoFormComponent, canActivate: [RoleGuard], data: { roles: [3] } },
  { path: 'admin/medicos/medico-form/:id', component: MedicoFormComponent, canActivate: [RoleGuard], data: { roles: [3] } },

  // ===== RUTAS LEGACY/REDIRECCIONES =====
  { path: 'medicoshome', redirectTo: '/medicos', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { 
}
