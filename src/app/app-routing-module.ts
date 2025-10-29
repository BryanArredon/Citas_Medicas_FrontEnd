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

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'create-account', component: CreateAccount },
  { path: 'areas', component: AreaComponent },
  { path: 'areas/:idArea', component: ServicioComponent },
  { path: 'servicios', component: ServicioComponent },
  { path: 'cita-list', component: CitaList },
  { path: 'account', loadComponent: () => import('./components/account/account').then(m => m.Account) },
  { path: 'medicoshome', component: Medico },
  { path: 'medicos', component: MedicosComponent },
  { path: 'historial', component: Historial },
  { path: 'agenda-medico', loadComponent: () => import('./components/medico/agenda-medico/agenda-medico').then(m => m.AgendaMedico) },
  { path: 'historial-clinico', loadComponent: () => import('./components/historial/historial').then(m => m.Historial) },
  { path: 'agenda-calendar',component: AgendaMedicoCalendarComponent },
  { path: 'servicios/:servicioId/medicos', component: MedicosComponent },
  { path: 'cita-forms', component: CitasComponent },
  { path: 'admin/areas', component: AdminAreasComponent },
  { path: 'admin/areas/area-form', component: AreaFormComponent },
  { path: 'admin/areas/area-form/:id', component: AreaFormComponent },
  { path: 'admin/servicios', component: AdminServicioComponent },
  { path: 'admin/servicios/servicio-form', component: ServicioFormComponent },
  { path: 'admin/servicios/servicio-form/:id', component: ServicioFormComponent },
  { path: 'admin/medicos', component: AdminMedicoComponent },
  { path: 'admin/medicos/medico-form', component: MedicoFormComponent },
  { path: 'admin/medicos/medico-form/:id', component: MedicoFormComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { 
}
