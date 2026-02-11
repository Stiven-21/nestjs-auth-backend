import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ReAuthService } from 'src/modules/auth/re-auth/re-auth.service';
import { REAUTH_REQUIRED_KEY } from 'src/modules/auth/decorators/re-auth.decorator';
import { I18nContext } from 'nestjs-i18n';
import { ResponseFactory } from 'src/common/exceptions/response.factory';

@Injectable()
export class ReAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly reauthService: ReAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiresReauth = this.reflector.getAllAndOverride<boolean>(
      REAUTH_REQUIRED_KEY,
      [context.getHandler(), context.getClass()],
    );
    const i18n = I18nContext.current();

    if (!requiresReauth) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user)
      ResponseFactory.error({ i18n, lang: i18n.lang, code: 'UNAUTHORIZED' });

    const reauthToken = request.headers['x-reauth-token'];

    if (!reauthToken)
      ResponseFactory.error({
        i18n,
        lang: i18n.lang,
        code: 'REAUTH_TOKEN_NOT_FOUND',
      });

    const valid = await this.reauthService.validate(user.id, reauthToken, i18n);

    if (!valid)
      ResponseFactory.error({
        i18n,
        lang: i18n.lang,
        code: 'INVALID_REAUTH_TOKEN',
      });

    return true;
  }
}
