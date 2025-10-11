import { Component, signal } from '@angular/core';
import '@tailwindplus/elements';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Citas_Medicas_FrontEnd');
}
