import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Area } from './components/area/area';
import { Servicio } from './components/servicio/servicio';
import { Home } from './components/home/home';
import { Login } from './components/user/login/login';
import { CreateAccount } from './components/user/create-account/create-account';
import { CitaList } from './components/cita/cita-list/cita-list';
import { Account } from './components/account/account';
import { Medico } from './components/medico/medico';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'login', component: Login},
  { path: 'create-account', component: CreateAccount },
  { path: 'areas', component: Area },
  { path: 'servicios', component: Servicio },
  { path: 'cita-list', component: CitaList },
  { path: 'account', component: Account },
  { path: 'medicos', component: Medico }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { 
}
