import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { forbiddenError, unauthorizedError } from 'src/common/exceptions';
import { DefaultLanguage } from 'src/common/types/languages.types';

@Injectable()
export class UserSelfOrAdminGuard implements CanActivate {
  private readonly logger = new Logger(UserSelfOrAdminGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    const i18n = I18nContext.current();
    const lang =
      i18n.lang ||
      request.headers['accept-language'] ||
      request.headers['x-language'] ||
      request.headers['x-custom-lang'] ||
      DefaultLanguage;

    if (!token)
      unauthorizedError({
        i18n,
        lang,
        description: i18n.t('messages.auth.guard.noActiveSession', {
          lang,
        }),
      });

    const payload = this.jwtService.decode(token);
    if (!payload || !payload.sub)
      unauthorizedError({
        i18n,
        lang,
        description: i18n.t('messages.auth.guard.unauthorized', {
          lang,
        }),
      });

    const user = payload; // viene del JWT
    const paramId = Number(request.params.id);

    if (!user) return false;

    // Caso 1: es el mismo usuario
    if (user.sub === paramId) return true;

    // Caso 2: tiene rol o permiso elevado
    if (user.role === 'super_admin' || user.role?.permissions?.includes('all'))
      return true;

    forbiddenError({
      i18n,
      lang,
    });
  }

  private extractTokenFromHeader(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
