import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface FunctionCall {
  name: string;
  arguments: any;
  result?: any;
}

@Injectable({
  providedIn: 'root'
})
export class OpenAIAssistantService {
  
  private apiKey = ''; // Se carga automáticamente del backend
  private assistantId = ''; // Se carga automáticamente del backend
  private backendUrl = 'http://localhost:8080/api/ia/funciones';
  private configUrl = 'http://localhost:8080/api/ia/config'; // Endpoint de configuración
  private openAIProxyUrl = 'http://localhost:8080/api/ia/openai'; // Proxy backend para OpenAI
  
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private actionsSubject = new BehaviorSubject<any>(null);
  public actions$ = this.actionsSubject.asObservable();

  private configCargada = false;
  
  // Thread actual de la conversación
  private currentThreadId: string | null = null;

  constructor(private http: HttpClient) {
    // Cargar configuración automáticamente
    this.cargarConfiguracion();
    
    // Mensaje de bienvenida
    this.addMessage('assistant', 
      '👋 Hola! Soy tu asistente de MediCitas.\n\n' +
      '¿Qué necesitas?\n\n' +
      '1️⃣ Agendar una cita\n' +
      '2️⃣ Ver mis citas\n' +
      '3️⃣ Buscar médico\n' +
      '4️⃣ Cancelar cita\n\n' +
      'Escribe el número o cuéntame qué necesitas 😊'
    );
  }

  /**
   * Carga la configuración de OpenAI desde el backend
   */
  private async cargarConfiguracion(): Promise<void> {
    try {
      const config = await this.http.get<{apiKey: string, assistantId: string}>(this.configUrl).toPromise();
      if (config) {
        this.apiKey = config.apiKey;
        this.assistantId = config.assistantId;
        this.configCargada = true;
        console.log('✅ Configuración de OpenAI cargada correctamente');
      }
    } catch (error) {
      console.error('❌ Error al cargar configuración de OpenAI:', error);
      this.configCargada = false;
    }
  }

  /**
   * Verifica si la configuración está cargada
   */
  estaConfigurado(): boolean {
    return this.configCargada && !!this.apiKey && !!this.assistantId;
  }

  /**
   * Envía un mensaje al asistente
   */
  async enviarMensaje(mensaje: string, userId: number): Promise<void> {
    // Agregar mensaje del usuario
    this.addMessage('user', mensaje);
    this.loadingSubject.next(true);

    try {
      // Esperar a que la configuración esté cargada
      if (!this.configCargada) {
        await this.cargarConfiguracion();
      }

      // Intentar llamar a OpenAI
      try {
        // 1. Crear thread si no existe
        if (!this.currentThreadId) {
          const thread = await this.crearThread();
          this.currentThreadId = thread.id;
          console.log('🆕 Nuevo thread creado:', this.currentThreadId);
        } else {
          console.log('♻️ Reutilizando thread existente:', this.currentThreadId);
        }
        
        // 2. Agregar mensaje al thread existente
        await this.agregarMensaje(this.currentThreadId!, mensaje, userId);
        
        // 3. Ejecutar asistente
        const run = await this.ejecutarAsistente(this.currentThreadId!, userId);
        
        // 4. Procesar respuesta
        await this.procesarRespuesta(this.currentThreadId!, run.id, userId);
      } catch (apiError: any) {
        console.error('Error de API OpenAI:', apiError);
        
        // Si hay error de CORS, explicar
        if (apiError.message?.includes('Failed to fetch') || 
            apiError.message?.includes('CORS') ||
            apiError.message?.includes('NetworkError')) {
          this.addMessage('assistant',
            '🚫 **Error de conexión con OpenAI**\n\n' +
            'No se puede conectar directamente desde el navegador por restricciones de seguridad (CORS).\n\n' +
            '**Solución:**\n' +
            'Se requiere configurar un proxy en el backend. Contacta al administrador del sistema.\n\n' +
            '**Mensaje de error:**\n' +
            `\`${apiError.message}\``
          );
        } else {
          // Otro tipo de error
          this.addMessage('assistant',
            '❌ **Error al procesar tu mensaje**\n\n' +
            `Detalles: ${apiError.message}\n\n` +
            'Verifica que tu API Key y Assistant ID sean correctos.'
          );
        }
      }
      
    } catch (error: any) {
      console.error('Error general en enviarMensaje:', error);
      this.addMessage('assistant', 
        '❌ Lo siento, ocurrió un error inesperado.\n\n' +
        `Detalles: ${error.message || 'Error desconocido'}`
      );
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Crea un nuevo thread de conversación
   */
  private async crearThread(): Promise<any> {
    try {
      const response = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(`Error al crear thread: ${response.status} - ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Error en crearThread:', error);
      throw new Error(`No se pudo crear la conversación: ${error.message}`);
    }
  }

  /**
   * Agrega un mensaje al thread
   */
  private async agregarMensaje(threadId: string, contenido: string, userId: number): Promise<any> {
    try {
      const response = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/messages`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            role: 'user',
            content: contenido,
            metadata: { userId: userId.toString() }
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(`Error al agregar mensaje: ${response.status} - ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Error en agregarMensaje:', error);
      throw new Error(`No se pudo enviar el mensaje: ${error.message}`);
    }
  }

  /**
   * Ejecuta el asistente
   */
  private async ejecutarAsistente(threadId: string, userId: number): Promise<any> {
    const response = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/runs`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          assistant_id: this.assistantId,
          tools: this.obtenerFuncionesDisponibles(),
          additional_instructions: `CONTEXTO CRÍTICO: El usuario YA está autenticado y logueado en el sistema. 
          
Para obtener su información (pacienteId, nombre, etc.), DEBES llamar a la función obtenerDatosPaciente() SIN PARÁMETROS al inicio de cualquier operación.

Esta función automáticamente obtiene los datos del usuario logueado (userId=${userId}). NO inventes ni pidas el usuarioId, la función ya sabe quién es el usuario.

IMPORTANTE: obtenerDatosPaciente() NO requiere argumentos. Solo llámala así: obtenerDatosPaciente()`
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Error al ejecutar asistente: ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Define las funciones disponibles para la IA
   */
  private obtenerFuncionesDisponibles() {
    return [
      {
        type: 'function',
        function: {
          name: 'obtenerAreas',
          description: 'Obtiene todas las áreas médicas disponibles',
          parameters: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'obtenerServicios',
          description: 'Obtiene todos los servicios médicos disponibles',
          parameters: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'buscarMedicos',
          description: 'Busca médicos, opcionalmente filtrados por servicio o por nombre',
          parameters: {
            type: 'object',
            properties: {
              servicioId: {
                type: 'number',
                description: 'ID del servicio para filtrar médicos'
              },
              nombre: {
                type: 'string',
                description: 'Nombre del médico para filtrar (opcional)'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'obtenerHorarios',
          description: 'Obtiene los próximos horarios disponibles. Si se proporciona medicoId, muestra solo los horarios de ese médico. Si NO se proporciona medicoId, muestra horarios de TODOS los médicos disponibles (siguientes 7 días)',
          parameters: {
            type: 'object',
            properties: {
              medicoId: {
                type: 'number',
                description: 'ID del médico (opcional). Si no se proporciona, muestra todos los horarios disponibles'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'obtenerCitasPaciente',
          description: 'Obtiene todas las citas de un paciente',
          parameters: {
            type: 'object',
            properties: {
              pacienteId: {
                type: 'number',
                description: 'ID del paciente'
              }
            },
            required: ['pacienteId']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'agendarCita',
          description: 'Agenda/crea una nueva cita médica. Requiere pacienteId, horarioId, servicioId y opcionalmente motivo',
          parameters: {
            type: 'object',
            properties: {
              pacienteId: { 
                type: 'number',
                description: 'ID del paciente que agenda la cita'
              },
              horarioId: { 
                type: 'number',
                description: 'ID del horario médico seleccionado'
              },
              servicioId: { 
                type: 'number',
                description: 'ID del servicio médico solicitado'
              },
              motivo: { 
                type: 'string',
                description: 'Motivo o descripción de la consulta (opcional)'
              }
            },
            required: ['pacienteId', 'horarioId', 'servicioId']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'obtenerDatosPaciente',
          description: 'Obtiene los datos completos del paciente autenticado (nombre, pacienteId, correo, teléfono). NO requiere parámetros, usa automáticamente el usuario logueado.',
          parameters: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'cancelarCita',
          description: 'Cancela una cita existente',
          parameters: {
            type: 'object',
            properties: {
              citaId: { type: 'number' },
              pacienteId: { type: 'number' }
            },
            required: ['citaId', 'pacienteId']
          }
        }
      }
    ];
  }

  /**
   * Procesa la respuesta del asistente
   */
  private async procesarRespuesta(threadId: string, runId: string, userId: number): Promise<void> {
    let run = await this.obtenerRun(threadId, runId);
    let intentos = 0;
    const maxIntentos = 120; // 60 segundos máximo (500ms * 120)
    
    // Esperar a que complete con polling más frecuente
    while ((run.status === 'queued' || run.status === 'in_progress') && intentos < maxIntentos) {
      await this.esperar(500); // Reducido de 1000ms a 500ms
      run = await this.obtenerRun(threadId, runId);
      intentos++;
      
      // Mostrar progreso cada 2 segundos
      if (intentos % 4 === 0) {
        console.log(`⏳ Esperando respuesta de IA... (${intentos * 0.5}s) - Status: ${run.status}`);
      }
    }
    
    // Timeout
    if (intentos >= maxIntentos) {
      console.error('❌ Timeout alcanzado. Último status:', run);
      throw new Error('⏱️ Timeout: La IA está tardando más de lo esperado. Por favor, intenta de nuevo.');
    }

    // Si requiere acciones (function calls)
    if (run.status === 'requires_action') {
      const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
      const toolOutputs = [];

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log(`🤖 IA está ejecutando: ${functionName}`, functionArgs);

        // Ejecutar la función en el backend
        const resultado = await this.ejecutarFuncion(functionName, functionArgs, userId);

        toolOutputs.push({
          tool_call_id: toolCall.id,
          output: JSON.stringify(resultado)
        });
      }

      // Enviar resultados a OpenAI
      await this.enviarResultadosFunciones(threadId, runId, toolOutputs);
      
      // Procesar de nuevo (recursión)
      return await this.procesarRespuesta(threadId, runId, userId);
    }

    // Si completó, obtener los mensajes
    if (run.status === 'completed') {
      const mensajes = await this.obtenerMensajes(threadId);
      
      if (mensajes.data && mensajes.data.length > 0) {
        const ultimoMensaje = mensajes.data[0];
        if (ultimoMensaje.content && ultimoMensaje.content.length > 0) {
          let textoRespuesta = ultimoMensaje.content[0].text.value;
          
          // Detectar comandos especiales para acciones del frontend
          const paymentModalMatch = textoRespuesta.match(/\[SHOW_PAYMENT_MODAL:([^\]]+)\]/);
          if (paymentModalMatch) {
            // Extraer parámetros del comando
            const params = paymentModalMatch[1].split(':');
            const concepto = params[0] || 'Pago de cita médica';
            const monto = parseFloat(params[1]) || 0;
            
            // Enviar acción al frontend
            this.actionsSubject.next({
              type: 'SHOW_PAYMENT_MODAL',
              data: { concepto, monto }
            });
            
            // Remover el comando del mensaje visible
            textoRespuesta = textoRespuesta.replace(paymentModalMatch[0], '').trim();
          }
          
          this.addMessage('assistant', textoRespuesta);
        }
      }
    }

    if (run.status === 'failed') {
      const errorMsg = run.last_error?.message || 'Error desconocido';
      
      // Detectar error de cuota excedida
      if (errorMsg.includes('quota') || errorMsg.includes('billing')) {
        throw new Error(
          '💳 **Sin créditos en OpenAI**\n\n' +
          'Tu cuenta de OpenAI ha agotado los créditos disponibles.\n\n' +
          '**Cómo solucionarlo:**\n' +
          '1. Ve a https://platform.openai.com/settings/organization/billing\n' +
          '2. Agrega un método de pago\n' +
          '3. Compra créditos ($5 USD mínimo)\n\n' +
          '**Nota:** Las cuentas nuevas reciben $5 USD gratis por 3 meses.\n\n' +
          `Mensaje de OpenAI: ${errorMsg}`
        );
      }
      
      throw new Error(`El asistente falló: ${errorMsg}`);
    }
  }

  /**
   * Ejecuta una función en el backend
   */
  private async ejecutarFuncion(nombreFuncion: string, argumentos: any, userId: number): Promise<any> {
    try {
      switch (nombreFuncion) {
        case 'obtenerAreas':
          return await this.http.get(`${this.backendUrl}/areas`).toPromise();

        case 'obtenerServicios':
          return await this.http.get(`${this.backendUrl}/servicios`).toPromise();

        case 'buscarMedicos':
          let params = '';
          if (argumentos.servicioId) params += `?servicioId=${argumentos.servicioId}`;
          if (argumentos.nombre) params += (params ? '&' : '?') + `nombre=${encodeURIComponent(argumentos.nombre)}`;
          return await this.http.get(`${this.backendUrl}/medicos${params}`).toPromise();

        case 'obtenerHorarios':
          // Si medicoId es null o undefined, obtener todos los horarios
          const medicoParam = argumentos.medicoId ? `?medicoId=${argumentos.medicoId}` : '';
          return await this.http.get(
            `${this.backendUrl}/horarios${medicoParam}`
          ).toPromise();

        case 'obtenerCitasPaciente':
          return await this.http.get(
            `${this.backendUrl}/citas/paciente/${argumentos.pacienteId || userId}`
          ).toPromise();

        case 'agendarCita':
          const citaData = {
            pacienteId: argumentos.pacienteId, // Puede ser null si la IA no lo envía
            usuarioId: userId, // Siempre enviamos el userId del usuario logueado como respaldo
            horarioId: argumentos.horarioId,
            servicioId: argumentos.servicioId,
            motivo: argumentos.motivo || 'Consulta médica'
          };
          return await this.http.post(`${this.backendUrl}/agendar-cita`, citaData).toPromise();

        case 'obtenerDatosPaciente':
          // Siempre usar el userId del contexto (usuario logueado)
          return await this.http.get(`${this.backendUrl}/paciente/${userId}`).toPromise();

        case 'cancelarCita':
          return await this.http.delete(
            `${this.backendUrl}/citas/${argumentos.citaId}?pacienteId=${argumentos.pacienteId || userId}`
          ).toPromise();

        default:
          return { error: 'Función no reconocida: ' + nombreFuncion };
      }
    } catch (error: any) {
      console.error(`Error ejecutando ${nombreFuncion}:`, error);
      return {
        exito: false,
        mensaje: `Error al ejecutar ${nombreFuncion}: ${error.message}`
      };
    }
  }

  /**
   * Métodos auxiliares
   */
  private async obtenerRun(threadId: string, runId: string): Promise<any> {
    const response = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
      { headers: this.getHeaders() }
    );
    return await response.json();
  }

  private async enviarResultadosFunciones(threadId: string, runId: string, toolOutputs: any[]): Promise<any> {
    const response = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/runs/${runId}/submit_tool_outputs`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ tool_outputs: toolOutputs })
      }
    );
    return await response.json();
  }

  private async obtenerMensajes(threadId: string): Promise<any> {
    const response = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      { headers: this.getHeaders() }
    );
    return await response.json();
  }

  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    };
  }

  private esperar(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private addMessage(role: 'user' | 'assistant', content: string) {
    const messages = this.messagesSubject.value;
    messages.push({
      role,
      content,
      timestamp: new Date()
    });
    this.messagesSubject.next([...messages]);
  }

  /**
   * Limpia el historial de mensajes y resetea el thread
   */
  limpiarHistorial() {
    this.messagesSubject.next([]);
    this.currentThreadId = null;
    console.log('🧹 Historial limpiado y thread reseteado');
    this.addMessage('assistant', 
      '👋 Hola! Soy tu asistente de MediCitas.\n\n' +
      '¿Qué necesitas?\n\n' +
      '1️⃣ Agendar una cita\n' +
      '2️⃣ Ver mis citas\n' +
      '3️⃣ Buscar médico\n' +
      '4️⃣ Cancelar cita\n\n' +
      'Escribe el número o cuéntame qué necesitas 😊'
    );
  }
}
