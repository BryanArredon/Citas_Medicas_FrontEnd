import { NgModule, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Home } from './components/home/home';
import { Area } from './components/area/area';
import { Servicio } from './components/servicio/servicio';
import { Medico } from './components/medico/medico';
import { CitaList } from './components/cita/cita-list/cita-list';
import { CitaForm } from './components/cita/cita-form/cita-form';
import { CitaDetail } from './components/cita/cita-detail/cita-detail';
import { Account } from './components/account/account';

@NgModule({
  declarations: [
    App,
    Home,
    Area,
    Servicio,
    Medico,
    CitaList,
    CitaForm,
    CitaDetail,
    Account
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideClientHydration(withEventReplay())
  ],
  bootstrap: [App]
})
export class AppModule { }
