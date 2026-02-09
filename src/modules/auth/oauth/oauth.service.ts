import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { I18nContext } from 'nestjs-i18n';
import { unauthorizedError } from 'src/common/exceptions';

export type OAuthFlow = 'login' | 'link' | 'reauth';

export interface OAuthStatePayload {
  flow: OAuthFlow;
  userId?: number;
}

@Injectable()
export class OAuthStateService {
  private readonly secret = process.env.OAUTH_STATE_SECRET;
  private readonly logger = new Logger(OAuthStateService.name);

  sign(payload: OAuthStatePayload): string {
    if (!this.secret) {
      this.logger.error('Missing OAUTH_STATE_SECRET');
      throw new Error();
    }

    return jwt.sign(payload, this.secret, {
      expiresIn: '5m',
      issuer: 'auth-service',
    });
  }

  verify(state: string): OAuthStatePayload {
    const i18n = I18nContext.current();
    try {
      return jwt.verify(state, this.secret) as OAuthStatePayload;
    } catch (error) {
      this.logger.error(error);
      unauthorizedError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.auth.error.unauthorized', {
          lang: i18n.lang,
        }),
      });
    }
  }
}
