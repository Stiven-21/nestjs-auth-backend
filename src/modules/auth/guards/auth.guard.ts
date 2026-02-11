import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { ResponseFactory } from 'src/common/exceptions/response.factory';
import { DefaultLanguage } from 'src/common/types/languages.types';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
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
    const user_secret = await this.usersService.getUserSecret(
      payload.sub,
      i18n,
    );

    if (!user_secret)
      ResponseFactory.error({
        i18n,
        lang,
        code: 'USER_NOT_FOUND',
      });

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET + user_secret,
      });
      request.user = payload;
    } catch (error) {
      this.logger.error(error);
      ResponseFactory.error({
        i18n,
        lang,
        code: 'INVALID_TOKEN',
      });
    }

    return true;
  }

  private extractTokenFromHeader(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer') return token;

    if (request.cookies?.access_token) return request.cookies.access_token;

    return undefined;
  }
}
