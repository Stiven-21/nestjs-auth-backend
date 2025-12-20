import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserToken } from 'src/modules/users/entities/user-tokens.entity';
import { Repository } from 'typeorm';
import { CreateTokenEmailVerificationDto } from 'src/modules/users/dto/create-token.dto';
import { I18nContext } from 'nestjs-i18n';
import { v7 as uuidv7 } from 'uuid';
import { UserTokenEnum } from 'src/common/enum/user-token.enum';
import {
  internalServerError,
  notFoundError,
  okResponse,
} from 'src/common/exceptions';
import { MailService } from 'src/mails/mail.service';

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);
  constructor(
    @InjectRepository(UserToken)
    private readonly tokensRepository: Repository<UserToken>,
    private readonly mailService: MailService,
  ) {}

  async createTokenEmailVerification(
    createTokenDto: CreateTokenEmailVerificationDto,
    i18n: I18nContext,
  ) {
    let userToken: UserToken;
    const token = uuidv7();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 2);

    try {
      userToken = await this.tokensRepository.save({
        ...createTokenDto,
        token,
        type: UserTokenEnum.EMAIL_VERIFICATION,
        expiresAt,
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }

    const activationUrl = `${process.env.URL_FRONTEND}/auth/verify-email/${token}`;
    await this.mailService.sendMail(
      createTokenDto.user.email,
      'Verificación de correo', // Subject o asunto
      'auth-verification', // Plantilla o template
      { activationUrl },
      // { user: createTokenDto.user, token },
    );

    return userToken;
  }

  async createTokenPasswordReset(email: string, i18n: I18nContext) {
    const token = uuidv7();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 3);
    try {
      await this.tokensRepository.save({
        email,
        token,
        type: UserTokenEnum.PASSWORD_RESET,
        expiresAt,
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }

    const passwordResetUrl = `${process.env.URL_FRONTEND}/auth/reset-password/${token}`;
    await this.mailService.sendMail(
      email,
      'Restablecimiento de contraseña', // Subject o asunto
      'auth-reset-password', // Plantilla o template
      { passwordResetUrl },
    );
  }

  async updateTokenIsUsed(token: string, i18n: I18nContext) {
    this.findOne(token, i18n);
    try {
      return await this.tokensRepository.update({ token }, { isUsed: true });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  private async findOne(token: string, i18n: I18nContext) {
    let userToken: UserToken;
    try {
      userToken = await this.tokensRepository.findOneBy({ token });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
    if (!userToken || userToken.isUsed || userToken.expiresAt < new Date())
      notFoundError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.common.notFound', {
          lang: i18n.lang,
          args: { entity: i18n.t('entities.token.singular') },
        }),
      });
    return userToken;
  }

  async findOneByToken(token: string, i18n: I18nContext) {
    let userToken: UserToken;
    try {
      userToken = await this.tokensRepository.findOneBy({ token });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
    if (!userToken || userToken.isUsed || userToken.expiresAt < new Date())
      notFoundError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.common.notFound', {
          lang: i18n.lang,
          args: { entity: i18n.t('entities.token.singular') },
        }),
      });
    return okResponse({ i18n, lang: i18n.lang, data: userToken });
  }
}
