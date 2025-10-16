import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, AuthResponse } from '../../../services/auth';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading: boolean = false;
  passwordVisible: boolean = false;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  onSubmit() {
  console.log('Formulario enviado'); // Para debug
  if (this.loginForm.valid) {
    this.loading = true;
    this.errorMessage = '';

    const credentials = {
      correo: this.loginForm.get('email')?.value,
      contraseña: this.loginForm.get('password')?.value
    };

    console.log('Credenciales:', credentials); // Para debug

    this.authService.login(credentials).subscribe({
      next: (response: AuthResponse) => {
        console.log('Login exitoso:', response); // Para debug
        // Guardar datos en localStorage
        localStorage.setItem('userId', response.idUsuario.toString());
        localStorage.setItem('userRole', response.rol.toString());
        localStorage.setItem('userName', response.nombre);
        localStorage.setItem('userEmail', response.correoElectronico);
       
        setTimeout(() => this.redirectByRole(Number(response.rol)), 50);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error completo de autenticación:', error); // Para debug
        this.errorMessage = error.message || 'Error en el inicio de sesión';
        this.loading = false;
      },
      complete: () => {
        console.log('Login completado'); // Para debug
      }
    });

  } else {
    console.log('Formulario inválido'); // Para debug
    this.markFormGroupTouched(this.loginForm);
    this.errorMessage = 'Por favor, completa todos los campos correctamente';
  }
}

  private redirectByRole(role: number) {
    switch (role) {
      case 1: // Admin
        this.router.navigate(['/areas']);
        break;
      case 2: // Médico
        this.router.navigate(['/areas']);
        break;
      case 3: // Área
        this.router.navigate(['/areas']);
        break;
      default:
        console.error('Rol no reconocido:', role);
        this.errorMessage = 'Rol de usuario no válido';
        // Puedes redirigir a una página por defecto o mostrar error
        this.router.navigate(['/']);
    }
  }

  goToRegister() {
    this.router.navigate(['/create-account']);
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    
    if (field?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    
    if (field?.hasError('email')) {
      return 'Ingresa un correo electrónico válido';
    }
    
    if (field?.hasError('minlength')) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    
    return '';
  }
}