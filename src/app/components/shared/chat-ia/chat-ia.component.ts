import { 
  Component, 
  OnInit, 
  OnDestroy, 
  ViewChild, 
  ElementRef, 
  PLATFORM_ID, 
  Inject, 
  ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OpenAIAssistantService } from '../../../services/openai-assistant.service';
import { Nl2brPipe } from '../../../pipes/nl2br.pipe';
import { Subscription } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-chat-ia',
  standalone: true,
  imports: [CommonModule, FormsModule, Nl2brPipe],
  templateUrl: './chat-ia.component.html',
  styleUrl: './chat-ia.component.css',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class ChatIaComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  mensajes: any[] = [];
  mensajeUsuario = '';
  cargando = false;
  userId: number = 0;
  chatAbierto = false;
  mensajesNoLeidos = 0;
  mostrarChat = false; // Solo mostrar si está autenticado
  
  private subscriptions: Subscription[] = [];
  private isBrowser: boolean;

  constructor(
    private iaService: OpenAIAssistantService,
    @Inject(PLATFORM_ID) platformId: Object,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    // Solo ejecutar código de localStorage en el navegador
    if (this.isBrowser) {
      // Verificar si el usuario está autenticado
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      
      if (userId && token) {
        this.userId = parseInt(userId);
        this.mostrarChat = true; // Mostrar chat solo si está autenticado
      }
    }
  }

  ngOnInit() {
    // Suscribirse a los mensajes
    const messagesSub = this.iaService.messages$.subscribe(messages => {
      const oldLength = this.mensajes.length;
      this.mensajes = messages;
      
      // Si hay nuevos mensajes y el chat está cerrado, aumentar contador
      if (messages.length > oldLength && !this.chatAbierto) {
        this.mensajesNoLeidos += messages.length - oldLength;
      }
      
      // Forzar detección de cambios
      this.cdr.detectChanges();
      setTimeout(() => this.scrollToBottom(), 100);
    });
    
    // Suscribirse al estado de carga
    const loadingSub = this.iaService.loading$.subscribe(loading => {
      this.cargando = loading;
      // Forzar detección de cambios cuando cambie el estado de carga
      this.cdr.detectChanges();
    });
    
    this.subscriptions.push(messagesSub, loadingSub);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleChat() {
    this.chatAbierto = !this.chatAbierto;
    if (this.chatAbierto) {
      this.mensajesNoLeidos = 0;
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  async enviarMensaje() {
    if (!this.mensajeUsuario.trim()) return;

    const mensaje = this.mensajeUsuario;
    this.mensajeUsuario = '';
    
    await this.iaService.enviarMensaje(mensaje, this.userId);
  }

  limpiarHistorial() {
    if (confirm('¿Estás seguro de que deseas limpiar el historial?')) {
      this.iaService.limpiarHistorial();
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = 
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }

  // Helper para detectar Enter
  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarMensaje();
    }
  }
}
