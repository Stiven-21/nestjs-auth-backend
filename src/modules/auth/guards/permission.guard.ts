import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { I18nContext } from 'nestjs-i18n';
import { DEFAULT_LANGUAGE } from 'src/common/constants/i18n.constants';
import { ResponseFactory } from 'src/common/exceptions/response.factory';

/**
 * @description
 * Guarda de NestJS que implementa la lógica de autorización
 * basada en roles y permisos.
 *
 * Utiliza el `Reflector` para leer los permisos requeridos
 * definidos mediante decoradores en los controladores o manejadores de ruta.
 *
 * @tutorial
 * Los permisos requeridos se definen con un decorador personalizado, por ejemplo:
 * `@SetMetadata('permissions', ['users:read', 'products:write'])`
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  // Constante para el rol con acceso total
  private readonly SUPER_ADMIN_ROLE = 'super_administrador';
  // Constante para el permiso que concede acceso total
  private readonly ALL_PERMISSION = 'all';

  constructor(private reflector: Reflector) {}

  /**
   * @description
   * Determina si la solicitud actual puede proceder.
   *
   * @param context El contexto de ejecución actual.
   * @returns `true` si el usuario tiene los permisos requeridos, lanza
   * una `ForbiddenException` en caso contrario.
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const i18n = I18nContext.current();
    const lang =
      i18n.lang ||
      request.headers['accept-language'] ||
      request.headers['x-language'] ||
      request.headers['x-custom-lang'] ||
      DEFAULT_LANGUAGE;
    // 1. Obtener los permisos requeridos definidos en el manejador de ruta
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions', // Clave del decorador. Asegúrate que coincida con tu decorador.
      context.getHandler(),
    );

    // Si no se requieren permisos explícitos, se permite el acceso por defecto.
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // 2. Obtener el objeto de usuario desde la solicitud HTTP
    const user = request.user;

    // 3. Validación de la existencia del usuario y su rol
    // Nota: Se asume que un AuthGuard (como JwtAuthGuard) se ejecutó previamente
    // y adjuntó el objeto 'user' a la solicitud.
    if (!user || !user.role || typeof user.role.name !== 'string') {
      ResponseFactory.error({
        i18n,
        lang,
        code: 'UNAUTHORIZED',
      });
    }

    const userRoleName = user.role.name;
    const userPermissions: string[] = Array.isArray(user.role.permissions)
      ? user.role.permissions
      : [];

    // 4. Chequeo de acceso especial (Super Administrador o permiso 'all')
    if (
      userRoleName === this.SUPER_ADMIN_ROLE ||
      userPermissions.includes(this.ALL_PERMISSION)
    ) {
      return true;
    }

    // 5. Comprobación de que el usuario tiene *todos* los permisos requeridos
    const hasAllRequiredPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasAllRequiredPermissions) {
      ResponseFactory.error({
        i18n,
        lang,
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    return true; // Se devuelve true si todas las comprobaciones son exitosas.
  }
}
