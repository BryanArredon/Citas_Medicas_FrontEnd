import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../../services/user';
import { Usuario } from '../../../models/usuario.model';

@Component({
  selector: 'app-create-account',
  standalone: false,
  templateUrl: './create-account.html',
  styleUrls: ['./create-account.css']
})
export class CreateAccount implements OnInit, OnDestroy {
  registerForm!: FormGroup;
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  private destroy$ = new Subject<void>();

  // Expresiones regulares
  private readonly PHONE_PATTERN = /^[0-9]{10}$/;
  private readonly MIN_AGE = 18;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el formulario con validadores personalizados
   */
  private initForm(): void {
    this.registerForm = this.fb.group(
      {
        nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
        apellidos: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
        email: ['', [Validators.required, Validators.email]],
        telefono: ['', [Validators.required, this.phoneValidator.bind(this)]],
        fechaNacimiento: ['', [Validators.required, this.ageValidator.bind(this)]],
        password: ['', [Validators.required, Validators.minLength(6), this.passwordStrengthValidator.bind(this)]],
        confirmPassword: ['', [Validators.required]],
        aceptaTerminos: [false, [Validators.requiredTrue]]
      },
      {
        validators: [this.passwordMatchValidator.bind(this)]
      }
    );

    // Escuchar cambios en el campo de contraseña para revalidar confirmPassword
    this.registerForm.get('password')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.registerForm.get('confirmPassword')?.updateValueAndValidity({ emitEvent: false });
      });
  }

  /**
   * Validador de teléfono personalizado
   */
  private phoneValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }
    return this.PHONE_PATTERN.test(control.value) ? null : { invalidPhone: true };
  }

  /**
   * Validador de edad mínima
   */
  private ageValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const birthDate = new Date(control.value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age >= this.MIN_AGE ? null : { invalidAge: true };
  }

  /**
   * Validador de fortaleza de contraseña
   */
  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const password = control.value;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumeric = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const passwordStrong = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar;
    
    return passwordStrong ? null : { weakPassword: true };
  }

  /**
   * Validador que verifica que las contraseñas coincidan
   */
  private passwordMatchValidator(group: FormGroup): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  /**
   * Envía el formulario de registro
   */
  onSubmit(): void {
    if (!this.registerForm.valid) {
      this.markFormGroupTouched(this.registerForm);
      this.errorMessage = 'Por favor, completa todos los campos correctamente';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = this.registerForm.value;
    const [apellidoPaterno, ...apellidoMaternoArray] = formData.apellidos.trim().split(' ');
    
    const userData: Partial<Usuario> = {
      nombre: formData.nombre.trim(),
      apellidoPaterno: apellidoPaterno,
      apellidoMaterno: apellidoMaternoArray.length > 0 ? apellidoMaternoArray.join(' ') : null,
      correoElectronico: formData.email.trim().toLowerCase(),
      contraseña: formData.password,
      telefono: formData.telefono.trim(),
      fechaNacimiento: formData.fechaNacimiento,
      sexo: 'M', // Por defecto, deberías agregar un campo en el formulario para esto
      estatus: true,
      idRol: 3 // 3 = Paciente
    };

    this.userService.register(userData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: Usuario) => {
          this.successMessage = 'Cuenta creada exitosamente. Redirigiendo...';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1500);
        },
        error: (error: Error) => {
          this.loading = false;
          this.errorMessage = this.handleError(error);
        },
        complete: () => {
          this.loading = false;
        }
      });
  }

  /**
   * Marca todos los campos del formulario como tocados
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Verifica si un campo es inválido y debe mostrar error
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Retorna el mensaje de error apropiado para cada campo
   */
  getErrorMessage(fieldName: string): string {
    const field = this.registerForm.get(fieldName);

    if (!field || !field.errors) {
      return '';
    }

    switch (true) {
      case field.hasError('required'):
        return this.getRequiredErrorMessage(fieldName);

      case field.hasError('email'):
        return 'Ingresa un correo electrónico válido';

      case field.hasError('minlength'):
        return `Debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;

      case field.hasError('maxlength'):
        return `No puede exceder ${field.errors['maxlength'].requiredLength} caracteres`;

      case field.hasError('invalidPhone'):
        return 'Ingresa un número de teléfono válido (10 dígitos)';

      case field.hasError('invalidAge'):
        return `Debes tener al menos ${this.MIN_AGE} años`;

      case field.hasError('weakPassword'):
        return 'La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales';

      default:
        return '';
    }
  }

  /**
   * Maneja errores genéricos del servidor
   */
  private handleError(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    }

    if (error.status === 409) {
      return 'Este correo electrónico ya está registrado';
    }

    if (error.status === 400) {
      return 'Datos inválidos. Por favor, verifica tus datos';
    }

    if (error.status === 500) {
      return 'Error del servidor. Intenta nuevamente más tarde';
    }

    return 'Error al crear la cuenta. Intenta nuevamente';
  }

  /**
   * Retorna el mensaje de error para campos requeridos específicos
   */
  private getRequiredErrorMessage(fieldName: string): string {
    const messages: { [key: string]: string } = {
      nombre: 'El nombre es obligatorio',
      apellidos: 'Los apellidos son obligatorios',
      email: 'El correo es obligatorio',
      telefono: 'El teléfono es obligatorio',
      fechaNacimiento: 'La fecha de nacimiento es obligatoria',
      password: 'La contraseña es obligatoria',
      confirmPassword: 'Debes confirmar tu contraseña',
      aceptaTerminos: 'Debes aceptar los términos y condiciones'
    };

    return messages[fieldName] || 'Este campo es obligatorio';
  }

  /**
   * Verifica si hay error de contraseñas no coincidentes a nivel de formulario
   */
  hasPasswordMismatch(): boolean {
    return !!(this.registerForm.hasError('passwordMismatch') && 
              (this.registerForm.get('confirmPassword')?.touched || 
               this.registerForm.get('confirmPassword')?.dirty));
  }

  /**
   * Navega al login
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
    getUserRoleText(): string {
    return 'Paciente'; // Ya que este componente es específico para registro de pacientes
  }

}