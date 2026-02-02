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
import { AuthSessionsService } from 'src/modules/auth/sessions/sessions.service';
import { AuthRefreshTokensService } from 'src/modules/auth/refresh-tokens/refresh-tokens.service';
import { TwoFactorAuthVerifyDto } from 'src/modules/auth/dto/2fa-verify.dto';
import { SecurityRecoveryCodesService } from 'src/modules/users/security-recovery-codes/security-recovery-codes.service';
import { TwoFactorEnableDto } from 'src/modules/auth/dto/2fa-enable.dto';
import { TotpService } from 'src/modules/users/security/totp/totp.service';
import { TwoFactorType } from 'src/common/enum/two-factor-type.enum';
import { TwoFAConfirmDto } from './dto/2fa-confirm.dto';

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
    private readonly authSessionsService: AuthSessionsService,
    private readonly authRefreshTokenService: AuthRefreshTokensService,
    private readonly userSecurityRecoveryCodes: SecurityRecoveryCodesService,
    private readonly totpService: TotpService,
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

      await this.securityService.create({ user }, i18n, manager);

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

    await this.dataSource.transaction(async (manager) => {
      await this.credentialsService.updatePassword(
        userToken.data.user.email,
        resetPasswordTokenDto,
        i18n,
        manager,
      );
      await this.usersService.updatePassword(
        userToken.data.user.id,
        i18n,
        manager,
      );
      await this.tokensService.updateTokenIsUsed(token, i18n, manager);
    });

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

  async login(
    req: Request,
    loginDto: LoginDto,
    deviceId: string,
    i18n: I18nContext,
  ) {
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

    return await this.__Validate2FAUser(req, user, i18n, deviceId);
  }

  async logout(sessionId: number, i18n: I18nContext) {
    await this.dataSource.transaction(async (manager) => {
      await this.authRefreshTokenService.revokeTokenWithSessionId(
        sessionId,
        i18n,
        manager,
      );
      await this.authSessionsService.updateActive(
        sessionId,
        false,
        i18n,
        manager,
      );
    });

    return okResponse({
      i18n,
      lang: i18n.lang,
      data: {
        data: i18n.t('messages.auth.success.logout', { lang: i18n.lang }),
        total: 0,
      },
    });
  }

  async logoutDevice(deviceId: string, i18n: I18nContext) {
    const authSession = await this.authSessionsService.findByDeviceId(
      deviceId,
      i18n,
    );

    await this.dataSource.transaction(async (manager) => {
      await this.authRefreshTokenService.revokeTokenWithSessionId(
        authSession.id,
        i18n,
        manager,
      );
      await this.authSessionsService.updateActive(
        authSession.id,
        false,
        i18n,
        manager,
      );
    });

    return okResponse({
      i18n,
      lang: i18n.lang,
      data: {
        data: i18n.t('messages.auth.success.logout', { lang: i18n.lang }),
        total: 0,
      },
    });
  }

  async logoutAll(userId: number, sessionId: number, i18n: I18nContext) {
    await this.authSessionsService.findBySessionId(sessionId, i18n);
    // CORREGIR - NO ME DEBE REVOCAR EL REFRESH TOKEN ACTUAL

    await this.dataSource.transaction(async (manager) => {
      await this.authRefreshTokenService.revokeTokenWithUserId(
        userId,
        i18n,
        manager,
      );
      await this.authSessionsService.updateInactiveUserId(
        userId,
        i18n,
        manager,
      );
    });

    return okResponse({
      i18n,
      lang: i18n.lang,
      data: {
        data: i18n.t('messages.auth.success.logoutAll', { lang: i18n.lang }),
        total: 0,
      },
    });
  }

  async loginById(
    req: Request,
    id: number,
    deviceId: string,
    i18n: I18nContext,
  ) {
    const user = await this.usersService.findById(id, i18n);
    return await this.__Validate2FAUser(req, user.data, i18n, deviceId);
  }

  async refreshToken(refreshToken: string, i18n: I18nContext) {
    if (!refreshToken) return badRequestError({ i18n, lang: i18n.lang });

    const authSession = await this.authRefreshTokenService.revokeRefreshToken(
      refreshToken,
      i18n,
    );

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
      sessionId: authSession.id,
      email: user.email,
      role: {
        name: user.role.name,
        permissions: user.role.permissions,
      },
    };

    const newRefreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '2d',
    });
    await this.authRefreshTokenService.createRefreshToken(
      {
        authSession,
        refreshToken: newRefreshToken,
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
          refresh_token: newRefreshToken,
        },
        total: 1,
      },
    });
  }

  private async __Validate2FAUser(
    req: Request,
    user: User,
    i18n: I18nContext,
    deviceId: string,
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

    // VERIFICAR QUE SI EL USUARIO TIENE 2FA ACTIVADO
    const userSecurity = await this.securityService.findOneByUser(user, i18n);
    if (userSecurity.twoFactorEnabled)
      return okResponse({
        i18n,
        lang: i18n.lang,
        data: {
          data: {
            twoFactorRequired: true,
            sub: user.id,
          },
          total: 0,
        },
      });

    return await this.__generatedTokenAndRefreshToken(
      req,
      user,
      i18n,
      deviceId,
    );
  }

  async enable2fa(
    req: Request,
    twoFactorEnableDto: TwoFactorEnableDto,
    i18n: I18nContext,
  ) {
    const userId = req.user['sub'];
    const { data: user } = await this.usersService.findById(userId, i18n);
    const userSecurity = await this.securityService.findOneByUser(user, i18n);

    if (userSecurity.twoFactorEnabled)
      badRequestError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.auth.error.twoFactorAlreadyEnabled', {
          lang: i18n.lang,
        }),
      });

    if (twoFactorEnableDto.twoFactorType === TwoFactorType.TOTP) {
      return await this.totpService.enableTotp(user.email, userSecurity, i18n);
    }
  }

  async confirm2fa(
    req: Request,
    twoFAConfirmDto: TwoFAConfirmDto,
    i18n: I18nContext,
  ) {
    const { code } = twoFAConfirmDto;
    const userId = req.user['sub'];
    const { data: user } = await this.usersService.findById(userId, i18n);
    const userSecurity = await this.securityService.findOneByUser(user, i18n);
    let valid = false;

    switch (userSecurity.twoFactorType) {
      case TwoFactorType.TOTP:
        valid = await this.totpService.verifyToken(
          userSecurity.twoFactorData.secret.base32,
          code,
        );
        if (valid) {
          const secret = userSecurity.twoFactorData.secret;
          userSecurity.twoFactorData = {
            secret,
            algorithm: 'sha1',
            digits: 6,
            period: 30,
          };
        }
        break;
    }

    if (!valid)
      badRequestError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.auth.error.twoFactorCodeInvalid', {
          lang: i18n.lang,
        }),
      });

    userSecurity.twoFactorEnabled = true;
    userSecurity.lastChangedAt = new Date();

    await this.securityService.save(userSecurity, i18n);
    return okResponse({
      i18n,
      lang: i18n.lang,
      data: {
        data: i18n.t('messages.auth.success.twoFactorEnabled', {
          lang: i18n.lang,
        }),
        total: 0,
      },
    });
  }

  async verify2fa(
    req: Request,
    twoFactorAuthVerifyDto: TwoFactorAuthVerifyDto,
    i18n: I18nContext,
    deviceId: string,
  ) {
    const { code, userId } = twoFactorAuthVerifyDto;
    const { data: user } = await this.usersService.findById(userId, i18n);
    const userSecurity = await this.securityService.findOneByUser(user, i18n);

    let valid = false;

    switch (userSecurity.twoFactorType) {
      case TwoFactorType.TOTP:
        valid = await this.totpService.verifyToken(
          userSecurity.twoFactorData.secret.base32,
          code,
        );
        break;
    }

    if (!valid && code)
      valid = await this.userSecurityRecoveryCodes.useCode(
        userId,
        { code },
        i18n,
      );

    if (!valid)
      badRequestError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.auth.error.wrongCode', {
          lang: i18n.lang,
        }),
      });

    return await this.__generatedTokenAndRefreshToken(
      req,
      user,
      i18n,
      deviceId,
    );
  }

  async disable2fa(req: Request, i18n: I18nContext) {
    const userId = req.user['sub'];
    const { data: user } = await this.usersService.findById(userId, i18n);
    const userSecurity = await this.securityService.findOneByUser(user, i18n);

    if (userSecurity.twoFactorEnabled) {
      userSecurity.twoFactorEnabled = false;
      userSecurity.lastChangedAt = new Date();
      await this.securityService.save(userSecurity, i18n);
      return okResponse({
        i18n,
        lang: i18n.lang,
        data: {
          data: i18n.t('messages.auth.success.twoFactorDisabled', {
            lang: i18n.lang,
          }),
          total: 0,
        },
      });
    }
  }

  private async __generatedTokenAndRefreshToken(
    req: Request,
    user: User,
    i18n: I18nContext,
    deviceId: string,
  ) {
    const { ip, userAgent, browser, os, device, location } =
      await getClientInfo(req);

    const { refreshToken, payload } = await this.dataSource.transaction<{
      refreshToken: string;
      payload: any;
    }>(async (manager) => {
      await this.sessionService.create(
        {
          userId: user.id,
          ip,
          device,
          userAgent,
          location,
        },
        i18n,
        manager,
      );

      const authSession = await this.authSessionsService.createAuthSession(
        {
          user,
          ipAddress: ip,
          userAgent,
          deviceId,
        },
        i18n,
        manager,
      );

      const payload = {
        sub: user.id,
        sessionId: authSession.id,
        email: user.email,
        role: {
          name: user.role.name,
          permissions: await this.normalizePermissions(user.role.permissions),
        },
      };

      const refreshToken = this.jwtService.sign(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '2d',
      });

      await this.authRefreshTokenService.createRefreshToken(
        {
          authSession,
          refreshToken,
        },
        i18n,
        manager,
      );

      return { refreshToken, payload };
    });

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

    req.user = {
      id: user.id,
      email: user.email,
      sessionId: payload.sessionId,
      deviceId,
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
          refresh_token: refreshToken,
          email: user.email,
          user: user.name + ' ' + user.lastname,
          role: user.role.name,
          permissions: user.role.permissions,
        },
        total: 1,
      },
    });
  }

  private async normalizePermissions(
    permissions: string | string[],
  ): Promise<string[]> {
    if (Array.isArray(permissions)) return permissions;

    if (typeof permissions === 'string')
      return permissions
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

    return [];
  }
}
