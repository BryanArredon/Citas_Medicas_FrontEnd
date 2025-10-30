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
  import { LoginComponent } from './components/user/login/login';
  import { ProgressSpinnerModule } from 'primeng/progressspinner';
  import { HomeComponent } from './components/home/home';
  import { CreateAccount } from './components/user/create-account/create-account';
  import { AgendaMedico } from './components/medico/agenda-medico/agenda-medico';
  


  @NgModule({
    declarations: [
      App,
      AreaComponent,
      LoginComponent,
      HomeComponent,
      CreateAccount,
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
      InputTextModule,
PasswordModule,
CheckboxModule,
DividerModule,
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
