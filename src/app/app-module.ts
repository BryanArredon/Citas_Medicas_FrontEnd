import { ApplicationConfig } from '@angular/core';
import { NgModule, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Material from '@primeuix/themes/material';


import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

@NgModule({
  declarations: [
    App,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [
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
