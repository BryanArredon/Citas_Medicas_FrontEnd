import { Component, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HorarioMedicoService, HorarioMedicoPayload } from '../../services/horario-medico.service';
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

// Importar componentes del calendario
import { CalendarComponent, CalendarEvent } from '../shared/calendar/calendar.component';
import { CalendarService } from '../../services/calendar.service';

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
    SelectModule,
    CalendarComponent
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
  horariosFiltrados: Horario[] = [];
  filtroVigencia: 'todos' | 'dia' | 'semana' | 'mes' = 'todos';

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
  activeView: string = 'lista'; // 'lista' o 'calendario'

  // Propiedades del calendario
  calendarEvents: CalendarEvent[] = [];
  showHorarioModal = false;

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
    private authService: AuthService,
    private calendarService: CalendarService
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
    
    if (!userIdStr) {
      console.warn('No se encontró userId en localStorage');
      return;
    }
    
    const userId = Number(userIdStr);
    console.log('Cargando horarios para usuario:', userId);
    
    // Usar el endpoint que funciona: listByUsuario
    this.horarioService.listByUsuario(userId).subscribe({
      next: (h) => { 
        console.log('Componente Medico - horarios cargados:', h);
        this.horarios = h;
        this.aplicarFiltroVigencia(); // Aplicar filtro
        this.filtrarHorasDisponibles();
        this.updateCalendarEvents();
        try { this.cdr.detectChanges(); } catch (e) { console.warn('detectChanges fallo', e); }
      },
      error: (e) => {
        console.error('Error cargando horarios:', e);
        // Inicializar vacío si falla
        this.horarios = [];
        this.horariosFiltrados = [];
        this.updateCalendarEvents();
      }
    });
  }

  // Cambiar filtro de vigencia
  cambiarFiltroVigencia(filtro: 'todos' | 'dia' | 'semana' | 'mes') {
    this.filtroVigencia = filtro;
    this.aplicarFiltroVigencia();
    this.updateCalendarEvents(); // Actualizar eventos del calendario
  }

  // Aplicar filtro de vigencia
  aplicarFiltroVigencia() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (this.filtroVigencia === 'todos') {
      this.horariosFiltrados = [...this.horarios];
      return;
    }

    let fechaLimite: Date;
    switch (this.filtroVigencia) {
      case 'dia':
        fechaLimite = new Date(hoy);
        fechaLimite.setDate(hoy.getDate() + 1);
        break;
      case 'semana':
        fechaLimite = new Date(hoy);
        fechaLimite.setDate(hoy.getDate() + 7);
        break;
      case 'mes':
        fechaLimite = new Date(hoy);
        fechaLimite.setMonth(hoy.getMonth() + 1);
        break;
      default:
        fechaLimite = new Date(hoy);
    }

    this.horariosFiltrados = this.horarios.filter(h => {
      if (!h.validUntil) return true; // Si no tiene validUntil, mostrarlo siempre
      
      const fechaValidUntil = new Date(h.validUntil + 'T00:00:00');
      return fechaValidUntil >= hoy && fechaValidUntil <= fechaLimite;
    });
  }

  // Obtener estadísticas de vigencia
  obtenerEstadisticasVigencia() {
    let vigentes = 0;
    let proximosVencer = 0;
    let vencidos = 0;

    this.horariosFiltrados.forEach(h => {
      if (this.haVencido(h)) {
        vencidos++;
      } else if (this.esProximoAVencer(h)) {
        proximosVencer++;
      } else {
        vigentes++;
      }
    });

    return { vigentes, proximosVencer, vencidos };
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

    if (!userIdStr) {
      alert('No se encontró información del usuario. Por favor inicia sesión nuevamente.');
      return;
    }

    // Usar userId como medicoId (asumiendo que son el mismo o están relacionados)
    const userId = Number(userIdStr);
    console.log('ID del usuario a usar como médico:', userId);

    // Crear datos del horario sin el objeto médico
    const horarioData = {
      fecha: fechaFormateada,
      horarioInicio: this.horaInicioSeleccionada ? this.formatTime(this.horaInicioSeleccionada) : '',
      horarioFin: this.horaFinSeleccionada ? this.formatTime(this.horaFinSeleccionada) : '',
      duracion: this.duracionSeleccionada,
      estadoMedico: this.estadoSeleccionado
    };

    console.log('Creando horario con datos:', horarioData);

    // Usar el método con fallback automático
    this.horarioService.createWithUserId(userId, horarioData).subscribe({
      next: (res) => {
        console.log('Horario creado exitosamente:', res);
        // Agregar el horario a la lista
        this.horarios.push(res);
        // Actualizar eventos del calendario
        this.updateCalendarEvents();
        // Recargar horarios desde el servidor para asegurar sincronización
        this.loadHorariosForLoggedUser();
        // Limpiar formulario y cerrar modal
        this.limpiarFormularioModerno();
        this.showHorarioModal = false;
        // Forzar detección de cambios
        this.cdr.detectChanges();
        alert('✅ Horario agregado exitosamente. Revisa la lista de horarios registrados.');
      },
      error: (err) => {
        console.error('Error creando horario:', err);
        alert(`❌ Error: ${err.message || 'No se pudo guardar el horario'}`);
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

  // ===============================
  // MÉTODOS DEL CALENDARIO
  // ===============================

  updateCalendarEvents() {
    // Convertir horarios filtrados a eventos de calendario con colores según vigencia
    // Crear eventos para el rango completo desde fecha de registro hasta validUntil
    this.calendarEvents = [];
    
    this.horariosFiltrados
      .filter(horario => horario.fecha && horario.horarioInicio && horario.horarioFin)
      .forEach(horario => {
        const [year, month, day] = horario.fecha!.split('-').map(Number);
        const fechaInicio = new Date(year, month - 1, day);
        
        // Determinar fecha final (validUntil o la misma fecha si no tiene validUntil)
        let fechaFin: Date;
        if (horario.validUntil) {
          const [yearFin, monthFin, dayFin] = horario.validUntil.split('-').map(Number);
          fechaFin = new Date(yearFin, monthFin - 1, dayFin);
        } else {
          // Si no tiene validUntil, solo mostrar el día específico
          fechaFin = new Date(year, month - 1, day);
        }

        // Determinar color según vigencia
        let backgroundColor = '#10b981'; // Verde por defecto (vigente)
        let borderColor = '#059669';
        let textColor = '#ffffff';
        
        if (this.haVencido(horario)) {
          backgroundColor = '#ef4444';
          borderColor = '#dc2626';
        } else if (this.esProximoAVencer(horario)) {
          backgroundColor = '#f59e0b';
          borderColor = '#d97706';
        } else if (horario.estadoMedico !== EstadoMedico.DISPONIBLE) {
          backgroundColor = '#6b7280';
          borderColor = '#4b5563';
        }

        // Generar un evento para cada día en el rango
        const currentDate = new Date(fechaInicio);
        while (currentDate <= fechaFin) {
          const [hours, minutes] = horario.horarioInicio!.split(':').map(Number);
          const startDateTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hours, minutes);
          
          const [endHours, endMinutes] = horario.horarioFin!.split(':').map(Number);
          const endDateTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), endHours, endMinutes);

          this.calendarEvents.push({
            id: horario.id || 0,
            title: `${horario.horarioInicio} - ${horario.horarioFin}`,
            start: startDateTime,
            end: endDateTime,
            type: horario.estadoMedico === EstadoMedico.DISPONIBLE ? 'disponible' : 'ocupado',
            color: borderColor,
            backgroundColor: backgroundColor,
            textColor: textColor,
            allDay: false,
            data: {
              duracion: horario.duracion,
              estado: horario.estadoMedico,
              validUntil: horario.validUntil,
              vencido: this.haVencido(horario),
              proximoAVencer: this.esProximoAVencer(horario),
              fechaRegistro: horario.fecha
            }
          } as CalendarEvent);

          // Avanzar al siguiente día
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });
  }

  changeView(view: string) {
    this.activeView = view;
  }

  // Eventos del calendario
  onEventClick(event: CalendarEvent) {
    console.log('Evento clickeado:', event);
    // Aquí podrías abrir un modal para editar el horario
  }

  onDayClick(date: Date) {
    console.log('Día clickeado:', date);
    this.fechaSeleccionada = date;
    this.indexEdicion = null; // Modo creación
    this.showHorarioModal = true;
  }

  onTimeSlotClick(data: {date: Date, hour: number}) {
    console.log('Slot de tiempo clickeado:', data);
    this.fechaSeleccionada = data.date;
    
    // Configurar hora de inicio
    const horaInicio = new Date(data.date);
    horaInicio.setHours(data.hour, 0, 0, 0);
    this.horaInicioSeleccionada = horaInicio;
    
    this.indexEdicion = null; // Modo creación
    this.showHorarioModal = true;
  }

  abrirModalNuevoHorario() {
    this.indexEdicion = null;
    this.fechaSeleccionada = new Date();
    this.horaInicioSeleccionada = null;
    this.horaFinSeleccionada = null;
    this.duracionSeleccionada = 30;
    this.estadoSeleccionado = EstadoMedico.DISPONIBLE;
    this.showHorarioModal = true;
  }

  cerrarModalHorario() {
    this.showHorarioModal = false;
    this.indexEdicion = null;
  }

  guardarHorarioModal() {
    if (this.indexEdicion !== null) {
      // Editar horario existente
      this.guardarEdicion();
    } else {
      // Crear nuevo horario
      this.agregarHorarioModerno();
    }
    this.cerrarModalHorario();
  }

  // Método helper para verificar si un horario está próximo a vencer
  esProximoAVencer(horario: Horario): boolean {
    if (!horario.validUntil) return false;
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const validUntil = new Date(horario.validUntil + 'T00:00:00');
    const diferenciaDias = Math.ceil((validUntil.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    
    return diferenciaDias >= 0 && diferenciaDias <= 7; // Próximo a vencer si quedan 7 días o menos
  }

  // Método helper para verificar si un horario ya venció
  haVencido(horario: Horario): boolean {
    if (!horario.validUntil) return false;
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const validUntil = new Date(horario.validUntil + 'T00:00:00');
    return validUntil < hoy;
  }

  // Obtener clase CSS según estado de vigencia
  obtenerClaseVigencia(horario: Horario): string {
    if (this.haVencido(horario)) {
      return 'text-red-700 bg-red-50 border border-red-200';
    } else if (this.esProximoAVencer(horario)) {
      return 'text-amber-700 bg-amber-50 border border-amber-200';
    }
    return 'text-indigo-700 bg-indigo-50 border border-indigo-200';
  }

  // Obtener icono según estado de vigencia
  obtenerIconoVigencia(horario: Horario): string {
    if (this.haVencido(horario)) {
      return 'pi-times-circle';
    } else if (this.esProximoAVencer(horario)) {
      return 'pi-exclamation-triangle';
    }
    return 'pi-check-circle';
  }
}

// (removed unused helper)