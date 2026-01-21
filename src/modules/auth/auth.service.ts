import { LoginDto } from 'src/modules/auth/dto/login.dto';
import { TokensService } from 'src/modules/users/tokens/tokens.service';
import { UserStatusEnum } from 'src/common/enum/user-status.enum';
import { Injectable, Logger, Param } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { RegisterDto } from 'src/modules/auth/dto/register.dto';
import { UsersService } from 'src/modules/users/users.service';
import {
  ResetPasswordDto,
  ResetPasswordTokenDto,
} from 'src/modules/auth/dto/reset-password.dto';
import {
  badRequestError,
  internalServerError,
  okResponse,
  unauthorizedError,
} from 'src/common/exceptions';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mails/mail.service';
import { getClientInfo } from 'src/common/helpers/request-info.helper';
import { Request } from 'express';
import { SessionService } from 'src/modules/users/session/session.service';
import { User } from 'src/modules/users/entities/user.entity';
import { CredentialsService } from 'src/modules/users/credentials/credentials.service';
import { DataSource } from 'typeorm';
import { SecurityService } from 'src/modules/users/security/security.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly securityService: SecurityService,
    private readonly tokensService: TokensService,
    private readonly sessionService: SessionService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly credentialsService: CredentialsService,
    private readonly dataSource: DataSource,
  ) {}

  async register(registerDto: RegisterDto, i18n: I18nContext) {
    return this.dataSource.transaction(async (manager) => {
      const user = await this.usersService.create(registerDto, i18n, manager);

      await this.credentialsService.create(
        { password: registerDto.password, user },
        i18n,
        manager,
      );

      await this.tokensService.createTokenEmailVerification(
        { user },
        i18n,
        manager,
      );

      await this.securityService.create(user, i18n, manager);

      return okResponse({
        i18n,
        lang: i18n.lang,
        data: { data: user.createdAt, total: 1 },
      });
    });
  }

  async verifyEmail(@Param('token') token: string, i18n: I18nContext) {
    const email = await this.usersService.verifyEmail(token, i18n);
    const loginUrl = process.env.URL_FRONTEND + '/auth/login';
    await this.mailService.sendMail(
      email,
      'Restablecimiento de contraseña exitoso', // Subject o asunto
      'auth-activation-success', // Plantilla o template
      {
        loginUrl,
      },
      i18n,
    );

    return okResponse({
      i18n,
      lang: i18n.lang,
      data: {
        data: i18n.t('messages.auth.success.verifyEmail', { lang: i18n.lang }),
        total: 0,
      },
    });
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto, i18n: I18nContext) {
    const { email } = resetPasswordDto;
    await this.tokensService.createTokenPasswordReset(email, i18n);
    return okResponse({
      i18n,
      lang: i18n.lang,
      data: {
        data: i18n.t('messages.auth.success.resetPassword', {
          lang: i18n.lang,
        }),
        total: 0,
      },
    });
  }

  async resetPasswordToken(
    token: string,
    resetPasswordTokenDto: ResetPasswordTokenDto,
    i18n: I18nContext,
  ) {
    const userToken = await this.tokensService.findOneByToken(token, i18n);
    await this.credentialsService.updatePassword(
      userToken.data.user.email,
      resetPasswordTokenDto,
      i18n,
    );
    await this.usersService.updatePassword(userToken.data.user.id, i18n);
    await this.tokensService.updateTokenIsUsed(token, i18n);
    const loginUrl = process.env.URL_FRONTEND + '/auth/login';
    await this.mailService.sendMail(
      userToken.data.user.email,
      'Restablecimiento de contraseña exitoso', // Subject o asunto
      'auth-password-success', // Plantilla o template
      {
        loginUrl,
        updateDate: new Date().toLocaleString(),
        updateTime: new Date().toLocaleTimeString(),
      },
      i18n,
    );
    return okResponse({
      i18n,
      lang: i18n.lang,
      data: {
        data: i18n.t('messages.auth.success.updatePassword', {
          lang: i18n.lang,
        }),
        total: 0,
      },
    });
  }

  async login(req: Request, loginDto: LoginDto, i18n: I18nContext) {
    const { email, password } = loginDto;

    const user = await this.usersService.findOneByEmail(email, i18n);

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword)
      badRequestError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.auth.error.wrongPassword', {
          lang: i18n.lang,
        }),
      });

    return await this.__generatedTokenAndRefreshToken(req, user, i18n);
  }

  async loginById(req: Request, id: number, i18n: I18nContext) {
    const user = await this.usersService.findById(id, i18n);
    return await this.__generatedTokenAndRefreshToken(req, user.data, i18n);
  }

  async refreshToken(refreshToken: string, i18n: I18nContext) {
    if (!refreshToken) return badRequestError({ i18n, lang: i18n.lang });
    try {
      this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }

    const session = this.jwtService.decode(refreshToken);
    if (!session)
      unauthorizedError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.auth.error.unauthorized', {
          lang: i18n.lang,
        }),
      });
    const { sub } = session;
    const data = await this.usersService.findOne(sub, i18n);
    const user = data.data.data;

    const payload = {
      sub: user.id,
      email: user.email,
      role: {
        name: user.role.name,
        permissions: user.role.permissions,
      },
    };

    return okResponse({
      i18n,
      lang: i18n.lang,
      data: {
        data: {
          access_token: this.jwtService.sign(payload, {
            secret: process.env.JWT_SECRET + user.user_secret,
            expiresIn: '30m',
          }),
          refresh_token: this.jwtService.sign(payload, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: '2d',
          }),
        },
        total: 1,
      },
    });
  }

  private async __generatedTokenAndRefreshToken(
    req: Request,
    user: User,
    i18n: I18nContext,
  ) {
    if (user.status === UserStatusEnum.PENDING)
      badRequestError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.auth.error.pendingUser', {
          lang: i18n.lang,
        }),
      });
    if (user.status === UserStatusEnum.SUSPENDED)
      badRequestError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.auth.error.suspendedUser', {
          lang: i18n.lang,
        }),
      });
    if (user.status === UserStatusEnum.INACTIVE)
      badRequestError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.auth.error.inactiveUser', {
          lang: i18n.lang,
        }),
      });

    const payload = {
      sub: user.id,
      email: user.email,
      role: {
        name: user.role.name,
        permissions: user.role.permissions,
      },
    };

    // CONFIGIRAR ENVIO DE EMAIL DE INICIO DE SESION
    const { ip, userAgent, browser, os, device } = getClientInfo(req);

    await this.sessionService.create(
      {
        userId: user.id,
        ip,
        device,
        userAgent: userAgent,
        location: null, // Luego se va a configurar por API
      },
      i18n,
    );

    await this.mailService.sendMail(
      user.email,
      'Alerta de inicio de sesión',
      'auth-login-alert',
      {
        loginDate: new Date().toLocaleString(),
        loginIp: ip,
        loginBrowser: browser,
        loginOs: os,
        changePasswordUrl: '', // url de cambio de contraseña
        // changePasswordUrl: process.env.CHANGE_PASSWORD_URL,
      },
      i18n,
    );

    return okResponse({
      i18n,
      lang: i18n.lang,
      data: {
        data: {
          access_token: this.jwtService.sign(payload, {
            secret: process.env.JWT_SECRET + user.user_secret,
            expiresIn: '30m',
          }),
          refresh_token: this.jwtService.sign(payload, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: '2d',
          }),
          email: user.email,
          user: user.name + ' ' + user.lastname,
          role: user.role.name,
          permissions: user.role.permissions,
        },
        total: 1,
      },
    });
  }
}
