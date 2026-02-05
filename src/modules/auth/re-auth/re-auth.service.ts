import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext } from 'nestjs-i18n';
import { internalServerError, unauthorizedError } from 'src/common/exceptions';
import { hashValue } from 'src/common/utils/hash.utils';
import { AuthReAuthToken } from 'src/modules/auth/entities/auth-reauth-token.entity';
import { CredentialsService } from 'src/modules/users/credentials/credentials.service';
import { EntityManager, Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class ReAuthService {
  private readonly logger = new Logger(ReAuthService.name);

  constructor(
    @InjectRepository(AuthReAuthToken)
    private readonly reAuthTokenRepository: Repository<AuthReAuthToken>,
    private readonly userAccountCredentialsService: CredentialsService,
  ) {}

  async reauthenticate(userId: number, password: string, i18n: I18nContext) {
    let isValid: boolean = false;
    try {
      isValid = await this.userAccountCredentialsService.validateReathPassword(
        userId,
        password,
        i18n,
      );
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }

    if (!isValid)
      unauthorizedError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.auth.error.wrongPassword', {
          lang: i18n.lang,
        }),
      });
    const token = uuidv7();

    try {
      await this.reAuthTokenRepository.update(
        { user: { id: userId } },
        { revoked: true },
      );
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }

    try {
      await this.reAuthTokenRepository.save({
        token: hashValue(token),
        user: { id: userId },
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }

    return token;
  }

  async consumeToken(
    userId: number,
    token: string,
    i18n: I18nContext,
    manager?: EntityManager,
  ) {
    const repo = manager
      ? manager.getRepository(AuthReAuthToken)
      : this.reAuthTokenRepository;

    let reAuthToken: AuthReAuthToken | null = null;
    try {
      reAuthToken = await this.reAuthTokenRepository.findOne({
        where: {
          user: { id: userId },
          token: hashValue(token),
          revoked: false,
        },
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }

    if (
      !reAuthToken ||
      (reAuthToken.expiresAt && reAuthToken.expiresAt < new Date()) ||
      reAuthToken.revoked
    )
      unauthorizedError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.auth.reauth.invalidReauthToken', {
          lang: i18n.lang,
        }),
      });

    const isTokenValid = hashValue(token) === reAuthToken.token;
    if (!isTokenValid)
      unauthorizedError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.auth.reauth.invalidReauthToken', {
          lang: i18n.lang,
        }),
      });

    try {
      await repo.update({ user: { id: userId } }, { revoked: true });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }
}
