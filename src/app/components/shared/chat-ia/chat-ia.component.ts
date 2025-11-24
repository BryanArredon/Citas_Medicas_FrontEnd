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
import { PagoModalComponent } from '../pago-modal/pago-modal.component';
import { Subscription } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-chat-ia',
  standalone: true,
  imports: [CommonModule, FormsModule, Nl2brPipe, PagoModalComponent],
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
  
  // Propiedades del modal de pago
  mostrarPagoModal = false;
  conceptoPago = '';
  montoPago = 0;
  citaInfoPago: any = null;
  
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

    // Suscribirse a las acciones especiales
    const actionsSub = this.iaService.actions$.subscribe(action => {
      if (action) {
        this.handleAction(action);
      }
    });
    
    this.subscriptions.push(messagesSub, loadingSub, actionsSub);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  handleAction(action: any) {
    switch (action.type) {
      case 'SHOW_PAYMENT_MODAL':
        this.abrirPagoModal(action.data.concepto, action.data.monto);
        break;
      default:
        console.log('Acción no reconocida:', action);
    }
  }

  toggleChat() {
    // Actualizar userId al abrir el chat
    if (this.isBrowser && !this.chatAbierto) {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        this.userId = parseInt(storedUserId);
        this.mostrarChat = true;
      }
    }

    this.chatAbierto = !this.chatAbierto;
    if (this.chatAbierto) {
      this.mensajesNoLeidos = 0;
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  async enviarMensaje() {
    if (!this.mensajeUsuario.trim()) return;

    // Actualizar userId desde localStorage antes de enviar
    if (this.isBrowser) {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        this.userId = parseInt(storedUserId);
      }
    }

    if (this.userId === 0) {
      console.error('No se puede enviar mensaje: Usuario no identificado');
      // Opcional: Mostrar mensaje al usuario
      return;
    }

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

  // Métodos del modal de pago
  abrirPagoModal(concepto: string, monto: number, citaInfo?: any) {
    this.conceptoPago = concepto;
    this.montoPago = monto;
    this.citaInfoPago = citaInfo;
    this.mostrarPagoModal = true;
  }

  cerrarPagoModal() {
    this.mostrarPagoModal = false;
    this.conceptoPago = '';
    this.montoPago = 0;
    this.citaInfoPago = null;
  }

  onPagoExitoso(pagoData: any) {
    console.log('💳 Pago exitoso desde chat:', pagoData);
    
    // Cerrar el modal
    this.cerrarPagoModal();
    
    // Enviar mensaje al asistente con los datos del pago
    const mensajePago = `Pago procesado exitosamente. Datos: ${JSON.stringify(pagoData)}`;
    this.iaService.enviarMensaje(mensajePago, this.userId);
  }
}
