import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AreaComponent } from './components/area/area';
import { Servicio } from './components/servicio/servicio';
import { HomeComponent } from './components/home/home';
import { LoginComponent } from './components/user/login/login';
import { CreateAccount } from './components/user/create-account/create-account';
import { CitaList } from './components/cita/cita-list/cita-list';
import { Account } from './components/account/account';
import { Medico } from './components/medico/medico';
import { Historial } from './components/historial/historial';
import { AgendaMedico } from './components/medico/agenda-medico/agenda-medico';
import { AgendaMedicoCalendarComponent } from './components/medico/agenda-medico-calendar/agenda-medico-calendar.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'create-account', component: CreateAccount },
  { path: 'areas', component: AreaComponent },
  { path: 'servicios', component: Servicio },
  { path: 'cita-list', component: CitaList },
  { path: 'account', loadComponent: () => import('./components/account/account').then(m => m.Account) },
  { path: 'medicoshome', component: Medico },
  { path: 'historial', component: Historial },
  { path: 'agenda-medico', loadComponent: () => import('./components/medico/agenda-medico/agenda-medico').then(m => m.AgendaMedico) },
  { path: 'historial-clinico', loadComponent: () => import('./components/historial/historial').then(m => m.Historial) },
  { path: 'agenda-calendar',component: AgendaMedicoCalendarComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { 
}
