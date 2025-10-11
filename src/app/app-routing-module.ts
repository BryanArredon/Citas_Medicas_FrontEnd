import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Area } from './components/area/area';
import { Servicio } from './components/servicio/servicio';
import { Home } from './components/home/home';
import { Login } from './components/user/login/login';
import { CreateAccount } from './components/user/create-account/create-account';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'login', component: Login},
  { path: 'create-account', component: CreateAccount },
  { path: 'area', component: Area },
  { path: 'servicio', component: Servicio }
  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { 
}
