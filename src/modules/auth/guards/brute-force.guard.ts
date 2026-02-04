import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { forbiddenError } from 'src/common/exceptions';
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

    const time =
      attempt.attempts >= 15
        ? '1d'
        : attempt.attempts >= 10
          ? '30m'
          : attempt.attempts >= 5
            ? '5m'
            : 0;

    if (attempt.blockedUntil && attempt.blockedUntil > new Date()) {
      forbiddenError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.auth.guard.bruteForceLogin', {
          lang: i18n.lang,
          args: {
            time,
          },
        }),
      });
    }

    return true;
  }
}
