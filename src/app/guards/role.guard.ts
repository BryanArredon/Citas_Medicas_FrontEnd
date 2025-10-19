import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const allowed: number[] = route.data['roles'];
    const role = this.auth.getCurrentUserRole();

    if (!allowed || allowed.length === 0) {
      return true; // sin restricción
    }

    if (role !== null && allowed.includes(role)) {
      return true;
    }

    // redirigir si no autorizado
    this.router.navigate(['/login']);
    return false;
  }
}
