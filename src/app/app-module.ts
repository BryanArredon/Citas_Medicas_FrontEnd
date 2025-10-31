  import { ApplicationConfig } from '@angular/core';
  import { provideHttpClient, withFetch } from '@angular/common/http';
  import { NgModule, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
  import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
  import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
  import { providePrimeNG } from 'primeng/config';
  import Material from '@primeuix/themes/material';
  import { FormsModule, ReactiveFormsModule } from '@angular/forms';
  import { AppRoutingModule } from './app-routing-module';
  import { HttpClientModule } from '@angular/common/http';
  import { App } from './app';
  import { AreaComponent } from './components/area/area';
  import { AreaService } from './services/area';
  import { ButtonModule } from 'primeng/button';
  import { MenuModule } from 'primeng/menu';
  import { CardModule } from 'primeng/card';
  import { CommonModule } from '@angular/common';
  import { AvatarModule } from 'primeng/avatar';
  import { RippleModule } from 'primeng/ripple';
  import { InputTextModule } from 'primeng/inputtext';
  import { PasswordModule } from 'primeng/password';
  import { CheckboxModule } from 'primeng/checkbox';
  import { DividerModule } from 'primeng/divider';
  import { DatePickerModule } from 'primeng/datepicker';
  import { ToastModule } from 'primeng/toast';
  import { ConfirmDialogModule } from 'primeng/confirmdialog';
  import { InputNumberModule } from 'primeng/inputnumber';
  import { DialogModule } from 'primeng/dialog';
  import { TooltipModule } from 'primeng/tooltip';
  import { LoginComponent } from './components/user/login/login';
  import { ProgressSpinnerModule } from 'primeng/progressspinner';
  import { HomeComponent } from './components/home/home';
  import { CreateAccount } from './components/user/create-account/create-account';
  import { ServicioComponent } from './components/servicio/servicio';
  import { MedicosComponent } from './components/medico-paciente/medico-paciente';
  import { AreaFormComponent } from './components/admin/area-form/area-form';
  import { AdminServicioComponent } from './components/admin/servicio/servicio';
  import { AdminMedicoComponent } from './components/admin/medico/medico';
  import { ServicioFormComponent } from './components/admin/servicio-form/servicio-form';
  import { MedicoFormComponent } from './components/admin/medico-form/medico-form';
  import { AdminAreasComponent } from './components/admin/area/area';
  import { CitasComponent } from './components/cita/cita-form/cita-form';
  import { CitaList } from './components/cita/cita-list/cita-list';
  import { Account } from './components/account/account';
  import { Historial } from './components/historial/historial';
  import { AgendaMedico } from './components/medico/agenda-medico/agenda-medico';
  import { AgendaMedicoCalendarComponent } from './components/medico/agenda-medico-calendar/agenda-medico-calendar.component';
  import { Medico } from './components/medico/medico';
  import { ServicioService } from './services/servicio';
  import { CitaService } from './services/cita';
  import { AgendaService } from './services/agenda';
  import { MedicoService } from './services/medico';
  import { PacienteService } from './services/paciente';
  import { CitaDataService } from './services/cita-data';
  import { NavigationMenuComponent } from './components/shared/navigation-menu/navigation-menu';
  import { CalendarComponent } from './components/shared/calendar/calendar.component';
  import { CitaModalComponent } from './components/shared/cita-modal/cita-modal.component';
  import { CalendarService } from './services/calendar.service';
  


  @NgModule({
    declarations: [
      App,
      AreaComponent,
      LoginComponent,
      HomeComponent,
      CreateAccount,
      ServicioComponent,
      MedicosComponent,
      AreaFormComponent,
      AdminServicioComponent,
      AdminMedicoComponent,
      ServicioFormComponent,
      MedicoFormComponent,
      AdminAreasComponent,
      CitasComponent,
      CitaList,
    ],
    imports: [
      BrowserModule,
      AppRoutingModule,
      FormsModule,
      HttpClientModule,
      ButtonModule,
      MenuModule,
      CardModule,
      CommonModule,
      AvatarModule,
      RippleModule,
      ReactiveFormsModule,
      InputTextModule,
      PasswordModule,
      CheckboxModule,
      DividerModule,
      ProgressSpinnerModule,
      DatePickerModule,
      ToastModule,
      ConfirmDialogModule,
      InputNumberModule,
      DialogModule,
      TooltipModule,
      Account,
      Historial,
      AgendaMedico,
      AgendaMedicoCalendarComponent,
      Medico,
      NavigationMenuComponent,
      CalendarComponent,
      CitaModalComponent,
  ],
    providers: [
      AreaService,
      ServicioService,
      CitaService,
      AgendaService,
      MedicoService,
      PacienteService,
      CitaDataService,
      CalendarService,
      provideHttpClient(withFetch()),
      provideBrowserGlobalErrorListeners(),
      provideZonelessChangeDetection(),
      provideClientHydration(withEventReplay()),
      provideAnimationsAsync(),
      providePrimeNG({
              theme: {
                  preset: Material,
                  options: {
                    cssLayer: {
                      name: 'primeng',
                      order: 'theme, base, primeng'
                    },
                    darkModeSelector: false || 'none'
                }
              }
          })
    ],
    bootstrap: [App]
  })
  export class AppModule { }
