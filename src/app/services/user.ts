import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api/usuarios';

  constructor(private http: HttpClient) {}

  register(userData: Partial<Usuario>): Observable<Usuario> {
    // Asegurarse de que el rol sea paciente (3)
    // Enviamos los datos tal cual vienen del componente
    const userDataWithRole = {
      ...userData
    };

    console.log('Enviando datos de registro:', userDataWithRole);

    return this.http.post<Usuario>(this.apiUrl, userDataWithRole).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en el registro:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          url: error.url,
          headers: error.headers.keys()
        });
        
        let errorMessage = 'Error desconocido';
        
        if (error.status === 400) {
          errorMessage = `Datos de registro inválidos: ${error.error?.message || 'Verifica los campos ingresados'}`;
        } else if (error.status === 409) {
          errorMessage = 'El correo electrónico ya está registrado';
        } else if (error.status === 0) {
          errorMessage = 'Error de conexión con el servidor';
        } else {
          errorMessage = error.error?.message || 'Error del servidor';
        }
        
        console.error('Mensaje de error:', errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  getById(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => new Error('Error al obtener el usuario'));
      })
    );
  }

  update(id: number, userData: Partial<Usuario>): Observable<Usuario> {
    console.log('Enviando datos de actualización:', { id, userData });

    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, userData).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en la actualización del usuario:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          url: error.url,
          headers: error.headers.keys()
        });

        let errorMessage = 'Error desconocido al actualizar el usuario';

        if (error.status === 400) {
          errorMessage = `Datos de actualización inválidos: ${error.error?.message || 'Verifica los campos enviados'}`;
        } else if (error.status === 404) {
          errorMessage = 'Usuario no encontrado';
        } else if (error.status === 409) {
          errorMessage = 'El correo electrónico ya está en uso por otro usuario';
        } else if (error.status === 500) {
          errorMessage = `Error interno del servidor: ${error.error?.message || 'Contacta al administrador'}`;
        } else if (error.status === 0) {
          errorMessage = 'Error de conexión con el servidor';
        } else {
          errorMessage = error.error?.message || `Error del servidor (${error.status})`;
        }

        console.error('Mensaje de error procesado:', errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
