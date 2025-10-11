import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.css',
  imports: [ButtonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]  
})
export class Home {

}
