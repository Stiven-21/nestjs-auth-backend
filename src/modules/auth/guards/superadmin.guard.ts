import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { DEFAULT_LANGUAGE } from 'src/common/constants/i18n.constants';
import { ResponseFactory } from 'src/common/exceptions/response.factory';
import { User } from 'src/modules/users/entities/user.entity';

/**
 * @description
 * Guarda de NestJS diseñado para restringir el acceso a rutas
 * exclusivamente al rol de 'super_administrador'.
 *
 * Este guard asume que un AuthGuard (p. ej., JWT) ya ha adjuntado
 * el objeto 'user' a la solicitud HTTP.
 */
@Injectable()
export class SuperadminGuard implements CanActivate {
  // Constante para el rol que tiene acceso exclusivo
  private readonly SUPER_ADMIN_ROLE = 'super_admin';

  /**
   * @description
   * Determina si el usuario actual tiene el rol de superadministrador.
   *
   * @param context El contexto de ejecución actual (petición HTTP).
   * @returns `true` si el usuario es superadministrador.
   * @throws {ForbiddenException} si el usuario no está autenticado, no tiene rol,
   * o no es el superadministrador.
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // Se asume que request.user tiene el tipo User o similar.
    const user: User = request.user;

    const i18n = I18nContext.current();
    const lang =
      i18n.lang ||
      request.headers['accept-language'] ||
      request.headers['x-language'] ||
      request.headers['x-custom-lang'] ||
      DEFAULT_LANGUAGE;

    // 1. Validación de Autenticación y Existencia de Rol
    // Se verifica que el objeto user exista y que contenga un objeto role válido.
    if (!user || !user.role || typeof user.role.name !== 'string') {
      // Mensaje general si falta autenticación o información crítica.
      ResponseFactory.error({
        i18n,
        lang,
        code: 'UNAUTHORIZED',
      });
    }

    // 2. Comprobación del Rol Específico
    const isSuperadmin = user.role.name === this.SUPER_ADMIN_ROLE;

    if (!isSuperadmin) {
      ResponseFactory.error({
        i18n,
        lang,
        code: 'FORBIDDEN_ACTION',
      });
    }

    // Si llega aquí, es porque es superadministrador.
    return true;
  }
}
