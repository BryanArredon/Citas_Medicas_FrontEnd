import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const allowed: number[] = route.data['roles'];
    const role = this.auth.getCurrentUserRole();

    console.log('RoleGuard - Ruta:', state.url, 'Roles permitidos:', allowed, 'Rol actual:', role);

    if (!allowed || allowed.length === 0) {
      console.log('RoleGuard - Sin restricciones de rol');
      return true; // sin restricción
    }

    if (role === null) {
      console.log('RoleGuard - Usuario no autenticado, redirigiendo a login');
      this.router.navigate(['/login']);
      return false;
    }

    if (allowed.includes(role)) {
      console.log('RoleGuard - Acceso permitido');
      return true;
    }

    console.log('RoleGuard - Acceso denegado, rol no autorizado');
    // redirigir a página de acceso denegado o dashboard apropiado
    this.router.navigate(['/home']);
    return false;
  }
}
