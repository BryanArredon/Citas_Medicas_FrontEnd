import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-estado-pago-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span 
      *ngIf="estadoPago" 
      class="estado-pago-badge" 
      [ngClass]="getEstadoClass()"
    >
      <i class="pi" [ngClass]="getIconoClass()"></i>
      {{ getEstadoTexto() }}
    </span>
  `,
  styles: [`
    .estado-pago-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }

    .estado-pago-badge i {
      font-size: 14px;
    }

    /* Estados */
    .pendiente {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      color: #92400e;
      border: 1px solid #fbbf24;
    }

    .aprobado {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      color: #065f46;
      border: 1px solid #34d399;
    }

    .rechazado {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      color: #991b1b;
      border: 1px solid #f87171;
    }

    .reembolsado {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      color: #1e40af;
      border: 1px solid #60a5fa;
    }

    .sin-pago {
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      color: #6b7280;
      border: 1px solid #d1d5db;
    }
  `]
})
export class EstadoPagoBadgeComponent {
  @Input() estadoPago?: string;

  getEstadoClass(): string {
    if (!this.estadoPago) return 'sin-pago';
    
    switch (this.estadoPago.toUpperCase()) {
      case 'APROBADO':
        return 'aprobado';
      case 'PENDIENTE':
        return 'pendiente';
      case 'RECHAZADO':
        return 'rechazado';
      case 'REEMBOLSADO':
        return 'reembolsado';
      default:
        return 'sin-pago';
    }
  }

  getIconoClass(): string {
    if (!this.estadoPago) return 'pi-minus-circle';
    
    switch (this.estadoPago.toUpperCase()) {
      case 'APROBADO':
        return 'pi-check-circle';
      case 'PENDIENTE':
        return 'pi-clock';
      case 'RECHAZADO':
        return 'pi-times-circle';
      case 'REEMBOLSADO':
        return 'pi-replay';
      default:
        return 'pi-minus-circle';
    }
  }

  getEstadoTexto(): string {
    if (!this.estadoPago) return 'Sin Pago';
    
    switch (this.estadoPago.toUpperCase()) {
      case 'APROBADO':
        return 'Pagado';
      case 'PENDIENTE':
        return 'Pendiente';
      case 'RECHAZADO':
        return 'Rechazado';
      case 'REEMBOLSADO':
        return 'Reembolsado';
      default:
        return 'Sin Pago';
    }
  }
}
