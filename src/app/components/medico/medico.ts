import { Component, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HorarioMedicoService, HorarioMedicoPayload } from '../../services/horario-medico';
import { HorarioMedico, EstadoMedico } from '../../models/horarioMedico.model';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { Menu } from 'primeng/menu';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';

type Horario = HorarioMedico;

@Component({
  selector: 'app-medico',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MenuModule,
    DatePickerModule,
    ButtonModule,
    CardModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule
  ],
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
  @ViewChild('menu') menu!: Menu;

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

  // Nuevas propiedades para el navbar moderno
  activeModule: string = 'medicos';
  userName: string = '';

  // Propiedades para el calendario y formulario moderno
  fechaSeleccionada: Date = new Date();
  horaInicioSeleccionada: Date | null = null;
  horaFinSeleccionada: Date | null = null;
  duracionSeleccionada: number = 30;

  // Horas disponibles filtradas
  horasDisponibles: Date[] = [];
  horasInicioDisponibles: any[] = [];
  horasFinDisponibles: any[] = [];

  // Opciones para el dropdown de estado
  opcionesEstado = [
    { label: 'Disponible', value: EstadoMedico.DISPONIBLE },
    { label: 'No Disponible', value: EstadoMedico.NO_DISPONIBLE },
    { label: 'Reservado', value: EstadoMedico.RESERVADO }
  ];
  estadoSeleccionado = EstadoMedico.DISPONIBLE;

  profileMenuItems: MenuItem[] = [
    {
      label: 'Mi Perfil',
      icon: 'pi pi-user',
      command: () => this.router.navigate(['/account'])
    },
    {
      label: 'Cerrar Sesión',
      icon: 'pi pi-sign-out',
      command: () => this.logout()
    }
  ];

  constructor(
    private horarioService: HorarioMedicoService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadHorariosForLoggedUser();
    this.filtrarHorasDisponibles(); // Inicializar horas disponibles
  }

  // Método para cargar información del usuario
  loadUserInfo() {
    const userName = localStorage.getItem('userName') || localStorage.getItem('userEmail') || 'Usuario';
    this.userName = userName.split('@')[0]; // Remover dominio del email si existe
  }

  // Método para cambiar de módulo
  selectModule(module: string) {
    this.activeModule = module;
    switch (module) {
      case 'areas':
        this.router.navigate(['/areas']);
        break;
      case 'servicios':
        this.router.navigate(['/servicios']);
        break;
      case 'medicos':
        this.router.navigate(['/medicos']);
        break;
      case 'mis-citas':
        this.router.navigate(['/cita-list']);
        break;
    }
  }

  // Método para cerrar sesión
  logout() {
    localStorage.clear();
    this.router.navigate(['/home']);
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
          this.filtrarHorasDisponibles(); // Filtrar horas disponibles después de cargar
          try { this.cdr.detectChanges(); } catch (e) { console.warn('detectChanges fallo', e); }
        },
        error: (err) => {
          console.warn('No se encontraron horarios por userId, intentando por email', err);
          if (email) {
            this.horarioService.listByUsuarioEmail(email).subscribe({ next: (h2) => { console.log('Componente Medico - asignando horarios por email (fallback):', h2); this.horarios = h2; this.filtrarHorasDisponibles(); try { this.cdr.detectChanges(); } catch(e){} }, error: (e) => console.error(e) });
          }
        }
      });
    } else if (email) {
      this.horarioService.listByUsuarioEmail(email).subscribe({ next: (h) => { console.log('Componente Medico - asignando horarios por email (no userId):', h); this.horarios = h; this.filtrarHorasDisponibles(); try { this.cdr.detectChanges(); } catch(e){} }, error: (e) => console.error(e) });
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
    // Validar que no tenga horarios ya registrados
    if (this.horarios.length > 0) {
      alert('Ya tienes un horario registrado. Solo puedes tener un horario activo.');
      return;
    }

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

  // Nuevo método para agregar horario usando el formulario moderno
  agregarHorarioModerno() {
    // Validar que no tenga horarios ya registrados
    if (this.horarios.length > 0) {
      alert('Ya tienes un horario registrado. Solo puedes tener un horario activo.');
      return;
    }

    // Validar campos requeridos
    if (!this.fechaSeleccionada || !this.horaInicioSeleccionada || !this.horaFinSeleccionada || !this.duracionSeleccionada) {
      alert('Por favor completa todos los campos');
      return;
    }

    // Formatear fecha a string
    const fechaFormateada = this.fechaSeleccionada.toISOString().split('T')[0];

    // Obtener el ID del médico del localStorage
    const userIdStr = localStorage.getItem('userId');
    const medicoIdStr = localStorage.getItem('medicoId');

    if (!medicoIdStr && !userIdStr) {
      alert('No se encontró información del médico. Por favor inicia sesión nuevamente.');
      return;
    }

    // Intentar usar medicoId primero, si no existe usar userId
    const medicoId = medicoIdStr ? Number(medicoIdStr) : Number(userIdStr);
    console.log('ID del médico a usar:', medicoId);

    // Crear payload con las nuevas propiedades
    const payload: HorarioMedicoPayload = {
      fecha: fechaFormateada,
      horarioInicio: this.horaInicioSeleccionada ? this.formatTime(this.horaInicioSeleccionada) : '',
      horarioFin: this.horaFinSeleccionada ? this.formatTime(this.horaFinSeleccionada) : '',
      duracion: this.duracionSeleccionada,
      estadoMedico: this.estadoSeleccionado
    };

    console.log('Creando horario moderno:', payload);
    const userId = Number(userIdStr);

    this.horarioService.createForUser(userId, payload).subscribe({
      next: (res) => {
        console.log('Horario creado OK:', res);
        this.horarios.push(res);
        this.limpiarFormularioModerno();
        // Mostrar mensaje de éxito
        alert('Horario agregado exitosamente');
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

  // Método para limpiar el formulario moderno
  limpiarFormularioModerno() {
    this.fechaSeleccionada = new Date();
    this.horaInicioSeleccionada = null;
    this.horaFinSeleccionada = null;
    this.duracionSeleccionada = 30;
    this.estadoSeleccionado = EstadoMedico.DISPONIBLE;
  }

  // Método auxiliar para formatear tiempo
  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // Método para generar todas las horas posibles en un día
  private generarHorasDelDia(): Date[] {
    const horas: Date[] = [];
    const fechaBase = new Date(this.fechaSeleccionada);
    fechaBase.setHours(8, 0, 0, 0); // Comenzar a las 8:00 AM

    // Generar horas desde 8:00 AM hasta 6:00 PM en intervalos de 30 minutos
    for (let hora = 8; hora <= 18; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 30) {
        const horaDate = new Date(fechaBase);
        horaDate.setHours(hora, minuto, 0, 0);
        horas.push(horaDate);
      }
    }

    return horas;
  }

  // Método para filtrar horas ocupadas
  private filtrarHorasDisponibles(): void {
    const todasLasHoras = this.generarHorasDelDia();
    const fechaSeleccionadaStr = this.fechaSeleccionada.toISOString().split('T')[0];

    // Obtener horarios ocupados para la fecha seleccionada
    const horariosOcupados = this.horarios.filter(h =>
      h.fecha === fechaSeleccionadaStr &&
      (h.estadoMedico === EstadoMedico.RESERVADO || h.estadoMedico === EstadoMedico.NO_DISPONIBLE)
    );

    // Crear un set de horas ocupadas para búsqueda rápida
    const horasOcupadasSet = new Set<string>();
    horariosOcupados.forEach(h => {
      // Agregar la hora de inicio y todas las horas intermedias basadas en la duración
      const horaInicio = new Date(`${h.fecha}T${h.horarioInicio}`);
      const duracionMinutos = h.duracion || 30;

      for (let minutos = 0; minutos < duracionMinutos; minutos += 30) {
        const horaOcupada = new Date(horaInicio.getTime() + minutos * 60000);
        horasOcupadasSet.add(this.formatTime(horaOcupada));
      }
    });

    // Filtrar horas disponibles
    this.horasDisponibles = todasLasHoras.filter(hora => {
      const horaStr = this.formatTime(hora);
      return !horasOcupadasSet.has(horaStr);
    });

    // Crear opciones formateadas para los selectores
    this.horasInicioDisponibles = this.horasDisponibles.map(hora => ({
      label: this.formatTime12h(hora),
      value: hora
    }));

    // Para hora de fin: debe ser posterior a la hora de inicio seleccionada
    this.actualizarHorasFinDisponibles();
  }

  // Método para actualizar horas de fin disponibles basado en la hora de inicio
  private actualizarHorasFinDisponibles(): void {
    if (!this.horaInicioSeleccionada) {
      this.horasFinDisponibles = this.horasDisponibles.map(hora => ({
        label: this.formatTime12h(hora),
        value: hora
      }));
      return;
    }

    const horaInicioTime = this.horaInicioSeleccionada.getTime();
    const duracionMinima = this.duracionSeleccionada * 60000; // convertir minutos a milisegundos

    const horasFinFiltradas = this.horasDisponibles.filter(hora => {
      return hora.getTime() > horaInicioTime + duracionMinima;
    });

    this.horasFinDisponibles = horasFinFiltradas.map(hora => ({
      label: this.formatTime12h(hora),
      value: hora
    }));
  }

  // Método auxiliar para formatear tiempo en formato 12 horas
  private formatTime12h(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  }

  // Método que se ejecuta cuando cambia la fecha
  onFechaChange(): void {
    this.filtrarHorasDisponibles();
    // Limpiar selecciones de hora cuando cambia la fecha
    this.horaInicioSeleccionada = null;
    this.horaFinSeleccionada = null;
  }

  // Método que se ejecuta cuando cambia la hora de inicio
  onHoraInicioChange(): void {
    this.actualizarHorasFinDisponibles();
    // Limpiar hora de fin si ya no es válida
    if (this.horaFinSeleccionada && (!this.horasFinDisponibles.some((h: any) =>
      h.value.getHours() === this.horaFinSeleccionada!.getHours() &&
      h.value.getMinutes() === this.horaFinSeleccionada!.getMinutes()
    ))) {
      this.horaFinSeleccionada = null;
    }
  }

  // Método que se ejecuta cuando cambia la duración
  onDuracionChange(): void {
    if (this.horaInicioSeleccionada) {
      this.actualizarHorasFinDisponibles();
      // Limpiar hora de fin si ya no es válida con la nueva duración
      if (this.horaFinSeleccionada && (!this.horasFinDisponibles.some((h: any) =>
        h.value.getHours() === this.horaFinSeleccionada!.getHours() &&
        h.value.getMinutes() === this.horaFinSeleccionada!.getMinutes()
      ))) {
        this.horaFinSeleccionada = null;
      }
    }
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

  verMiAgenda() {
    this.router.navigate(['/agenda-medico']);
  }
}

// (removed unused helper)