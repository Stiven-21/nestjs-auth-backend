import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { forbiddenError } from 'src/common/exceptions';
import { DefaultLanguage } from 'src/common/types/languages.types';
// Importa la definición de tipo (o entidad) del usuario
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
  private readonly SUPER_ADMIN_ROLE = 'super_administrador';

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
      DefaultLanguage;

    // 1. Validación de Autenticación y Existencia de Rol
    // Se verifica que el objeto user exista y que contenga un objeto role válido.
    if (!user || !user.role || typeof user.role.name !== 'string') {
      // Mensaje general si falta autenticación o información crítica.
      forbiddenError({
        i18n,
        lang,
        description: i18n.t('messages.auth.guard.noActiveSession', { lang }),
      });
    }

    // 2. Comprobación del Rol Específico
    const isSuperadmin = user.role.name === this.SUPER_ADMIN_ROLE;

    if (!isSuperadmin) {
      // Mensaje específico si el usuario está autenticado pero no tiene el rol correcto.
      forbiddenError({
        i18n,
        lang,
        description: i18n.t('messages.auth.guard.deniedOnlyAdmin', { lang }),
      });
    }

    // Si llega aquí, es porque es superadministrador.
    return true;
  }
}
