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
  import { LoginComponent } from './components/user/login/login';
  import { ProgressSpinnerModule } from 'primeng/progressspinner';
  import { HomeComponent } from './components/home/home';
  import { AgendaMedico } from './components/medico/agenda-medico/agenda-medico';
import { AreaFormComponent } from './components/admin/area-form/area-form';
import { MedicoFormComponent } from './components/admin/medico-form/medico-form';
import { ServicioFormComponent } from './components/admin/servicio-form/servicio-form';
  import { MedicosComponent } from './components/medico-paciente/medico-paciente';
  import { ToastModule } from 'primeng/toast';
  import { TooltipModule } from 'primeng/tooltip';
  import { InputNumberModule } from 'primeng/inputnumber';
  import { ConfirmDialogModule } from 'primeng/confirmdialog';
  import { DatePickerModule } from 'primeng/datepicker';
  import { CreateAccount } from './components/user/create-account/create-account';
  import { ServicioComponent } from './components/servicio/servicio';
  import { CitasComponent } from './components/cita/cita-form/cita-form';
  import { AdminAreasComponent } from './components/admin/area/area';
  import { MessageService } from 'primeng/api';
  import { AdminServicioComponent } from './components/admin/servicio/servicio';
import { AdminMedicoComponent } from './components/admin/medico/medico';

  


  @NgModule({
    declarations: [
      App,
      AreaComponent,
      LoginComponent,
      HomeComponent,
      CreateAccount,
      ServicioComponent,
      MedicosComponent,
      CitasComponent,
      AdminAreasComponent,
      AreaFormComponent,
      MedicoFormComponent,
      ServicioFormComponent,
      AdminServicioComponent,
      AdminMedicoComponent
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
      InputTextModule,
      PasswordModule,
      CheckboxModule,
      DividerModule,
      ToastModule,
      DatePickerModule,
      ConfirmDialogModule,
      TooltipModule,
      InputNumberModule,
  ],
    providers: [
      AreaService,
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
