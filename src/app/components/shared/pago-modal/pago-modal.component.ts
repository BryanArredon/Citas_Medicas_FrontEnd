import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CitaService } from '../../../services/cita';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-pago-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pago-modal.component.html',
  styleUrls: ['./pago-modal.component.css']
})
export class PagoModalComponent implements OnInit {
  @Input() visible: boolean = false;
  @Input() citaId: number | null = null;
  @Input() montoPagar: number = 0; // 🆕 Cambio de nombre para ser más claro
  @Input() concepto: string = ''; // 🆕 Cambio de nombre
  @Input() citaInfo: any = null; // 🆕 Información de la cita para mostrar
  @Output() onCerrar = new EventEmitter<void>(); // 🆕 Cambio de nombre
  @Output() onPagoExitoso = new EventEmitter<any>();

  // Datos del pago
  metodoPagoSeleccionado: number = 1; // Por defecto: Tarjeta de crédito
  procesandoPago: boolean = false;
  pasoActual: number = 0; // 🆕 Para la animación de pasos

  metodosPago = [
    { id: 1, nombre: 'Tarjeta de Crédito', icono: '💳' },
    { id: 2, nombre: 'Tarjeta de Débito', icono: '💳' },
    { id: 3, nombre: 'Efectivo', icono: '💵' },
    { id: 4, nombre: 'Transferencia', icono: '🏦' }
  ];

  constructor(
    private citaService: CitaService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {}

  cerrarModal(): void {
    this.visible = false;
    this.onCerrar.emit();
  }

  /**
   * 🆕 NUEVO FLUJO: Procesa el pago ANTES de crear la cita
   * Muestra simulación visual por pasos para que el usuario vea el proceso
   */
  procesarPago(): void {
    this.procesandoPago = true;
    this.pasoActual = 0;

    console.log('🎬 Iniciando simulación de pago...');

    // PASO 1: Validando método de pago (500ms)
    setTimeout(() => {
      this.pasoActual = 1;
      console.log('✅ Paso 1: Método de pago validado');
    }, 500);

    // PASO 2: Conectando con banco (1000ms)
    setTimeout(() => {
      this.pasoActual = 2;
      console.log('✅ Paso 2: Conectado con banco');
    }, 1500);

    // PASO 3: Confirmando pago (1500ms)
    setTimeout(() => {
      this.pasoActual = 3;
      console.log('✅ Paso 3: Pago confirmado');
    }, 2500);

    // FINALIZAR: Emitir al padre (3000ms total)
    setTimeout(() => {
      this.pasoActual = 4;
      
      const pagoData = {
        idMetodoPago: this.metodoPagoSeleccionado,
        idTarjeta: null
      };

      console.log('💳 Simulación completa. Enviando datos al backend:', pagoData);

      // Emitir el evento al componente padre
      // El padre llamará al endpoint /con-pago con cita + pago
      this.onPagoExitoso.emit(pagoData);
      
      this.procesandoPago = false;
      this.pasoActual = 0;
    }, 3500); // Total 3.5 segundos de simulación
  }

  getMetodoPagoNombre(): string {
    const metodo = this.metodosPago.find(m => m.id === this.metodoPagoSeleccionado);
    return metodo ? metodo.nombre : 'Seleccione un método';
  }

  getMetodoPagoIcono(): string {
    const metodo = this.metodosPago.find(m => m.id === this.metodoPagoSeleccionado);
    return metodo ? metodo.icono : '💳';
  }
}
