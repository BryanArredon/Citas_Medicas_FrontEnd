// services/cita-data.service.ts
import { Injectable } from '@angular/core';
import { MedicoDetalle } from '../models/medicoDetalle.model';
import { Servicio } from '../models/servicio.model';

@Injectable({
  providedIn: 'root'
})
export class CitaDataService {
  private medicoSeleccionado: MedicoDetalle | null = null;
  private servicioSeleccionado: Servicio | null = null;

  setMedicoSeleccionado(medico: MedicoDetalle) {
    this.medicoSeleccionado = medico;
  }

  setServicioSeleccionado(servicio: Servicio) {
    this.servicioSeleccionado = servicio;
  }

  getMedicoSeleccionado(): MedicoDetalle | null {
    return this.medicoSeleccionado;
  }

  getServicioSeleccionado(): Servicio | null {
    return this.servicioSeleccionado;
  }

  limpiarSeleccion() {
    this.medicoSeleccionado = null;
    this.servicioSeleccionado = null;
  }
}