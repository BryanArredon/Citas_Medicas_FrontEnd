import { ApplicationConfig } from '@angular/core';
import { NgModule, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Material from '@primeuix/themes/material';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing-module';
import { HttpClientModule } from '@angular/common/http';
import { App } from './app';
import { AreaComponent } from './components/area/area';
import { AreaService } from './services/area';

@NgModule({
  declarations: [
    App,
    AreaComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
  ],
  providers: [
    AreaService,
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
