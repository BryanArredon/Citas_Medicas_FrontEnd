import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface LoginRequest {
  correo: string;
  contraseña: string;
}

export interface RegisterRequest {
  nombre: string;
  apellidos: string;
  correo: string;
  contraseña: string;
  telefono: string;
  fechaNacimiento: string;
  rol: number;
}

export interface AuthResponse {
  idUsuario: number;
  nombre: string;
  correoElectronico: string;
  rol: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Error desconocido';
        
        if (error.status === 400 || error.status === 401) {
          errorMessage = 'Credenciales incorrectas';
        } else if (error.status === 0) {
          errorMessage = 'Error de conexión con el servidor';
        } else {
          errorMessage = error.error?.message || 'Error del servidor';
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  // Métodos auxiliares para gestionar el estado de autenticación
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Error desconocido';
        
        if (error.status === 400) {
          errorMessage = 'Datos de registro inválidos';
        } else if (error.status === 409) {
          errorMessage = 'El correo electrónico ya está registrado';
        } else if (error.status === 0) {
          errorMessage = 'Error de conexión con el servidor';
        } else {
          errorMessage = error.error?.message || 'Error del servidor';
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  getCurrentUserId(): string | null {
    const userId = localStorage.getItem('userId');
    return userId ? userId : null;
  }

  getCurrentUserRole(): number | null {
    const userRole = localStorage.getItem('userRole');
    return userRole ? parseInt(userRole, 10) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getCurrentUserId();
  }

  logout(): void {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
  }
}