import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ReAuthService } from 'src/modules/auth/re-auth/re-auth.service';
import { REAUTH_REQUIRED_KEY } from 'src/modules/auth/decorators/re-auth.decorator';
import { I18nContext } from 'nestjs-i18n';
import { forbiddenError, unauthorizedError } from 'src/common/exceptions';

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

    if (!user) unauthorizedError({ i18n, lang: i18n.lang });

    const reauthToken = request.headers['x-reauth-token'];

    if (!reauthToken)
      unauthorizedError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.auth.guard.noActiveSession', {
          lang: i18n.lang,
        }),
      });

    const valid = await this.reauthService.validate(user.id, reauthToken, i18n);

    if (!valid)
      forbiddenError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.auth.error.wrongReauthToken', {
          lang: i18n.lang,
        }),
      });

    return true;
  }
}
