import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthRefreshTokens } from '../entities/auth-refresh-tokens.entity';
import { EntityManager, Repository } from 'typeorm';
import { CreateAuthRefreshTokenDto } from '../dto/create-auth-refresh-token.dto';
import { I18nContext } from 'nestjs-i18n';
import {
  internalServerError,
  notFoundError,
  unauthorizedError,
} from 'src/common/exceptions';
import * as crypto from 'crypto';

@Injectable()
export class AuthRefreshTokensService {
  private readonly logger = new Logger(AuthRefreshTokensService.name);

  constructor(
    @InjectRepository(AuthRefreshTokens)
    private readonly refreshTokensRepository: Repository<AuthRefreshTokens>,
  ) {}

  async createRefreshToken(
    createauthRefreshTokenDto: CreateAuthRefreshTokenDto,
    i18n: I18nContext,
    manager?: EntityManager,
  ) {
    const repo = manager
      ? manager.getRepository(AuthRefreshTokens)
      : this.refreshTokensRepository;

    const { refreshToken, ...rest } = createauthRefreshTokenDto;

    try {
      return await repo.save({
        ...rest,
        token: await this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  async revokeRefreshToken(refreshToken: string, i18n: I18nContext) {
    let authRefreshToken: AuthRefreshTokens | null;
    try {
      authRefreshToken = await this.refreshTokensRepository.findOne({
        where: { token: await this.hashToken(refreshToken) },
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }

    if (!authRefreshToken) notFoundError({ i18n, lang: i18n.lang });

    if (authRefreshToken.revoked)
      unauthorizedError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.auth.refreshToken.alreadyRevoked', {
          lang: i18n.lang,
        }),
      });

    try {
      await this.refreshTokensRepository.update(
        { id: authRefreshToken.id },
        { revoked: true },
      );
      return authRefreshToken.authSession;
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  private async hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
