import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { ResponseFactory } from 'src/common/exceptions/response.factory';
import { AttemptsService } from 'src/modules/auth/attempts/attempts.service';

@Injectable()
export class BruteForceGuard implements CanActivate {
  private readonly logger = new Logger(BruteForceGuard.name);
  constructor(private readonly attemptsService: AttemptsService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const i18n = I18nContext.current();

    const email = request.body?.email;
    if (!email) return true;

    const attempt = await this.attemptsService.findEmail(email, i18n);
    if (!attempt) return true;

    if (attempt.blockedUntil && attempt.blockedUntil > new Date()) {
      ResponseFactory.error({
        i18n,
        lang: i18n.lang,
        code: 'BRUTE_FORCE_BLOCKED',
      });
    }

    return true;
  }
}
