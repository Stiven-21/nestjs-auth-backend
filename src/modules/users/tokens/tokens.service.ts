import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserToken } from 'src/modules/users/entities/user-tokens.entity';
import { EntityManager, Repository } from 'typeorm';
import { CreateTokenEmailVerificationDto } from 'src/modules/users/dto/create-token.dto';
import { I18nContext } from 'nestjs-i18n';
import { v7 as uuidv7 } from 'uuid';
import { UserTokenEnum } from 'src/common/enum/user-token.enum';
import { internalServerError, okResponse } from 'src/common/exceptions';
import { MailService } from 'src/mails/mail.service';
import { UsersService } from 'src/modules/users/users.service';
import { ResponseFactory } from 'src/common/exceptions/response.factory';

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);
  constructor(
    @InjectRepository(UserToken)
    private readonly tokensRepository: Repository<UserToken>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  async createTokenEmailVerification(
    createTokenDto: CreateTokenEmailVerificationDto,
    i18n: I18nContext,
    manager?: EntityManager,
  ) {
    const repo = manager
      ? manager.getRepository(UserToken)
      : this.tokensRepository;
    let userToken: UserToken;
    const token = uuidv7();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 2);

    try {
      userToken = await repo.save({
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
      i18n,
      // { user: createTokenDto.user, token },
    );

    return userToken;
  }

  async createTokenPasswordReset(email: string, i18n: I18nContext) {
    const token = uuidv7();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 3);
    const user = await this.usersService.findOneByEmail(email, i18n);
    try {
      await this.tokensRepository.save({
        user,
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
      i18n,
    );
  }

  async updateTokenIsUsed(
    token: string,
    i18n: I18nContext,
    manager?: EntityManager,
  ) {
    const repo = manager
      ? manager.getRepository(UserToken)
      : this.tokensRepository;
    this.findOne(token, i18n);
    try {
      return await repo.update({ token }, { isUsed: true });
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
      ResponseFactory.error({ i18n, lang: i18n.lang, code: 'TOKEN_NOT_FOUND' });
    return okResponse({ data: userToken });
  }
}
