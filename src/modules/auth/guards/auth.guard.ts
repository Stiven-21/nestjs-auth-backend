import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { unauthorizedError } from 'src/common/exceptions';
import { DefaultLanguage } from 'src/common/types/languages.types';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
    const user_secret = await this.usersService.getUserSecret(payload.sub);
    if (!user_secret)
      unauthorizedError({
        i18n,
        lang,
        description: i18n.t('messages.auth.guard.noActiveSession', {
          lang,
        }),
      });

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET + user_secret,
      });
      request.user = payload;
    } catch (error) {
      unauthorizedError({
        i18n,
        lang,
        description: i18n.t('messages.auth.guard.noActiveSession', {
          lang,
        }),
      });
    }

    return true;
  }

  private extractTokenFromHeader(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
