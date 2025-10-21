import { Component, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HorarioMedicoService, HorarioMedicoPayload } from '../../services/horario-medico.service';
import { HorarioMedico, EstadoMedico } from '../../models/horarioMedico.model';
import { AuthService } from '../../services/auth';

type Horario = HorarioMedico;

@Component({
  selector: 'app-medico',
  standalone: true,
  imports: [FormsModule, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './medico.html',
  styleUrls: ['./medico.css']
})
export class Medico implements OnInit {
  @ViewChild('inputFecha') inputFecha!: ElementRef;
  @ViewChild('inputHoraInicio') inputHoraInicio!: ElementRef;
  @ViewChild('inputHoraFin') inputHoraFin!: ElementRef;
  @ViewChild('inputDuracion') inputDuracion!: ElementRef;
  @ViewChild('inputEstado') inputEstado!: ElementRef;

  horarios: Horario[] = [];
  
  modalAbierto: boolean = false;
  indexEdicion: number | null = null;
  horarioEditando: Horario = {
    medico: { usuario: { nombre: '' } } as any,
    fecha: '',
    horarioInicio: '',
    horarioFin: '',
    duracion: 0,
    estadoMedico: EstadoMedico.DISPONIBLE
  };

  constructor(private horarioService: HorarioMedicoService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadHorariosForLoggedUser();
  }

  // Load horarios for the logged-in user (if the user is a medico)
  loadHorariosForLoggedUser() {
    const userIdStr = localStorage.getItem('userId');
    const email = localStorage.getItem('userEmail');
    if (userIdStr) {
      const userId = Number(userIdStr);
      this.horarioService.listByUsuario(userId).subscribe({
        next: (h) => { 
          console.log('Componente Medico - asignando horarios por userId:', h);
          this.horarios = h; 
          try { this.cdr.detectChanges(); } catch (e) { console.warn('detectChanges fallo', e); }
        },
        error: (err) => {
          console.warn('No se encontraron horarios por userId, intentando por email', err);
          if (email) {
            this.horarioService.listByUsuarioEmail(email).subscribe({ next: (h2) => { console.log('Componente Medico - asignando horarios por email (fallback):', h2); this.horarios = h2; try { this.cdr.detectChanges(); } catch(e){} }, error: (e) => console.error(e) });
          }
        }
      });
    } else if (email) {
      this.horarioService.listByUsuarioEmail(email).subscribe({ next: (h) => { console.log('Componente Medico - asignando horarios por email (no userId):', h); this.horarios = h; try { this.cdr.detectChanges(); } catch(e){} }, error: (e) => console.error(e) });
    }
  }

  

  // Safe accessor for nested medico.usuario.nombre to avoid template errors
  get medicoNombre(): string {
    return this.horarioEditando?.medico?.usuario?.nombre ?? '';
  }

  set medicoNombre(value: string) {
    if (!this.horarioEditando) return;
    if (!this.horarioEditando.medico) {
      this.horarioEditando.medico = { usuario: { nombre: value } } as any;
      return;
    }
    if (!this.horarioEditando.medico.usuario) {
      this.horarioEditando.medico.usuario = { nombre: value } as any;
      return;
    }
    this.horarioEditando.medico.usuario.nombre = value;
  }

  agregarHorario() {
    const fecha = this.inputFecha.nativeElement.value;
    const horaInicio = this.inputHoraInicio.nativeElement.value;
    const horaFin = this.inputHoraFin.nativeElement.value;
    const duracion = this.inputDuracion.nativeElement.value;
    const estado = this.inputEstado.nativeElement.value;

    if (!fecha || !horaInicio || !horaFin || !duracion) {
      alert('Por favor completa todos los campos');
      return;
    }

    // Obtener el ID del médico del localStorage y verificar el formato
    const userIdStr = localStorage.getItem('userId');
    const medicoIdStr = localStorage.getItem('medicoId');
    const userEmail = localStorage.getItem('userEmail');
    
    console.log('IDs almacenados:', {
      userId: userIdStr,
      medicoId: medicoIdStr,
      email: userEmail
    });

    if (!medicoIdStr && !userIdStr) {
      alert('No se encontró información del médico. Por favor inicia sesión nuevamente.');
      return;
    }

    // Intentar usar medicoId primero, si no existe usar userId
    const medicoId = medicoIdStr ? Number(medicoIdStr) : Number(userIdStr);
    console.log('ID del médico a usar:', medicoId);

    console.log('Creando horario para médico ID:', medicoId);
    
    // Usar el nuevo método createForUser que maneja la búsqueda del médico
    const payload: HorarioMedicoPayload = {
      fecha,
      horarioInicio: horaInicio,
      horarioFin: horaFin,
      duracion: parseInt(duracion),
      estadoMedico: estado as EstadoMedico
    };

    console.log('Preparando creación de horario:', payload);
    const userId = Number(userIdStr);
    this.horarioService.createForUser(userId, payload).subscribe({
      next: (res) => {
        console.log('Horario creado OK:', res);
        this.horarios.push(res);
        this.limpiarFormulario();
      },
      error: (err) => {
        console.error('Error creando horario:', err);
        if (err.status === 400) {
          alert('Error: No se pudo encontrar la información del médico. Por favor verifica tu sesión.');
        } else {
          alert('No se pudo guardar el horario en el servidor');
        }
      }
    });
  }

  limpiarFormulario() {
    this.inputFecha.nativeElement.value = '';
    this.inputHoraInicio.nativeElement.value = '';
    this.inputHoraFin.nativeElement.value = '';
    this.inputDuracion.nativeElement.value = '';
    this.inputEstado.nativeElement.value = 'DISPONIBLE';
  }

  abrirEdicion(index: number) {
    this.indexEdicion = index;
    this.horarioEditando = { ...this.horarios[index] };
    this.modalAbierto = true;
  }

  guardarEdicion() {
    if (this.indexEdicion !== null) {
  const actualizado = { ...this.horarioEditando } as Horario;

      // Si el horario tiene id en el back, deberíamos enviarlo; aquí intentamos actualizar
      // asumimos que horarioEditando puede contener un campo id (si fue cargado desde back)
      const possibleId = (this.horarioEditando as any).id;
      if (possibleId) {
          const payload: HorarioMedicoPayload = { ...actualizado };

        this.horarioService.update(possibleId, payload).subscribe({
          next: (res) => {
            console.log('Horario actualizado OK:', res);
            this.horarios[this.indexEdicion!] = actualizado;
            this.cerrarModal();
          },
          error: (err) => {
            console.error('Error actualizando horario:', err);
            alert('No se pudo actualizar el horario en el servidor');
          }
        });
      } else {
        // No hay id del backend, solo actualizar localmente
        this.horarios[this.indexEdicion] = actualizado;
        this.cerrarModal();
      }
    }
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.indexEdicion = null;
    this.horarioEditando = {
      medico: { usuario: { nombre: '' } } as any,
      fecha: '',
      horarioInicio: '',
      horarioFin: '',
      duracion: 0,
      estadoMedico: EstadoMedico.DISPONIBLE
    } as Horario;
  }

  eliminarHorario(index: number) {
    if (confirm('¿Estás seguro de que deseas eliminar este horario?')) {
  const h = this.horarios[index] as Horario;
  const possibleId = h?.id;
      if (possibleId) {
        this.horarioService.delete(possibleId).subscribe({
          next: () => {
            this.horarios.splice(index, 1);
          },
          error: (err) => {
            console.error('Error eliminando horario:', err);
            alert('No se pudo eliminar el horario en el servidor');
          }
        });
      } else {
        this.horarios.splice(index, 1);
      }
    }
  }
}

// (removed unused helper)