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
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { RippleModule } from 'primeng/ripple';



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
    ButtonModule,
    MenuModule,
    CardModule,
    CommonModule,
    AvatarModule,
    RippleModule
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
