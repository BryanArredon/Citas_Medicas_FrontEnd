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

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'create-account', component: CreateAccount },
  { path: 'areas', component: AreaComponent },
  { path: 'servicios', component: Servicio },
  { path: 'cita-list', component: CitaList },
  { path: 'account', component: Account },
  { path: 'medicoshome', component: Medico },
  { path: 'historial', component: Historial }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { 
}
