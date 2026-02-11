import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { DEFAULT_LANGUAGE } from 'src/common/constants/i18n.constants';
import { ResponseFactory } from 'src/common/exceptions/response.factory';

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
      DEFAULT_LANGUAGE;

    if (!token)
      ResponseFactory.error({
        i18n,
        lang,
        code: 'TOKEN_NOT_FOUND',
      });

    const payload = this.jwtService.decode(token);
    if (!payload || !payload.sub)
      ResponseFactory.error({
        i18n,
        lang,
        code: 'INVALID_TOKEN',
      });

    const user = payload;
    const paramId = Number(request.params.id);

    if (!user) return false;

    if (user.sub === paramId) return true;

    if (user.role === 'super_admin' || user.role?.permissions?.includes('all'))
      return true;

    ResponseFactory.error({
      i18n,
      lang,
      code: 'UNAUTHORIZED',
    });
  }

  private extractTokenFromHeader(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
