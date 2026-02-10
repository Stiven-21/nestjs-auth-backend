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
import {
  getClientInfo,
  getIPFromRequest,
} from 'src/common/helpers/request-info.helper';
import { Request, Response } from 'express';
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
import { TwoFAConfirmDto } from 'src/modules/auth/dto/2fa-confirm.dto';
import { OtpsService } from 'src/modules/users/security/otps/otps.service';
import { TwoFactorOtpsType } from 'src/common/enum/two-factor-otps.enum';
import { AttemptsService } from 'src/modules/auth/attempts/attempts.service';
import { AuditLogService } from 'src/modules/audit-log/audit-log.service';
import { AuditEvent } from 'src/common/enum/audit-event.enum';
import { parsePermissions } from 'src/common/utils/normalize-permissions.utils';
import { ReAuthService } from 'src/modules/auth/re-auth/re-auth.service';
import { OAuthStateService } from 'src/modules/auth/oauth/oauth.service';
import { OAuthProfile } from 'src/common/interfaces/oauth-profile.interface';
import { OAuthService } from 'src/modules/users/oauth/oauth.service';
import { ensureDeviceId } from 'src/common/helpers/session.helper';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private isProd = process.env.NODE_ENV === 'production';

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
    private readonly userSecurityRecoveryCodesService: SecurityRecoveryCodesService,
    private readonly attemptsService: AttemptsService,
    private readonly totpService: TotpService,
    private readonly otpsService: OtpsService,
    private readonly auditLogService: AuditLogService,
    private readonly reauthService: ReAuthService,
    private readonly oauthService: OAuthService,
    private readonly oauthStateService: OAuthStateService,
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
    req: Request,
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

    await this.logoutAll(userToken.data.user.id, null, i18n);
    await this.auditLogService.create(
      {
        event: AuditEvent.PASSWORD_CHANGED,
        actorId: userToken.data.user.id,
        ip: getIPFromRequest(req),
        userAgent: req.headers['user-agent'],
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
    res: Response,
    loginDto: LoginDto,
    deviceId: string,
    i18n: I18nContext,
  ) {
    const { email, password } = loginDto;
    const user = await this.usersService.findOneByEmail(email, i18n);
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      await this.attemptsService.recordFailure(
        email,
        getIPFromRequest(req),
        i18n,
      );
      await this.auditLogService.create(
        {
          event: AuditEvent.LOGIN_FAILED,
          ip: getIPFromRequest(req),
          userAgent: req.headers['user-agent'],
        },
        i18n,
      );
      badRequestError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.auth.error.wrongPassword', {
          lang: i18n.lang,
        }),
      });
    }

    return await this.__Validate2FAUser(req, res, user, i18n, deviceId);
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

  async logoutAll(userId: number, sessionId?: number, i18n?: I18nContext) {
    if (!sessionId)
      await this.authSessionsService.findBySessionId(sessionId, i18n);

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
    res: Response,
    id: number,
    deviceId: string,
    i18n: I18nContext,
  ) {
    const user = await this.usersService.findById(id, i18n);
    user.data.role.permissions = parsePermissions(user.data.role.permissions);
    return await this.__Validate2FAUser(req, res, user.data, i18n, deviceId);
  }

  async refreshToken(req: Request, refreshToken: string, i18n: I18nContext) {
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
        permissions: parsePermissions(user.role.permissions),
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

    await this.auditLogService.create(
      {
        event: AuditEvent.REFRESH_TOKEN_REVOKED,
        ip: getIPFromRequest(req),
        userAgent: req.headers['user-agent'],
        actorId: user.id,
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
    res: Response,
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
    if (userSecurity.twoFactorEnabled) {
      if (userSecurity.twoFactorType === TwoFactorType.EMAIL) {
        const code = await this.otpsService.createOtp(
          user,
          TwoFactorOtpsType.EMAIL,
          i18n,
        );
        this.mailService.sendMail(
          user.email,
          'Codigo de seguridad',
          'auth-2fa-otp',
          {
            otpCode: code,
            expiryMinutes: 5,
            loginIp: getIPFromRequest(req),
          },
          i18n,
        );
      }
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
    }

    return await this.__generatedTokenAndRefreshToken(
      req,
      res,
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

    const dataSend = {
      data: null,
      total: 0,
    };

    switch (twoFactorEnableDto.twoFactorType.toLowerCase()) {
      case TwoFactorType.TOTP:
        const dataImage = await this.totpService.enableTotp(
          user.email,
          userSecurity,
          i18n,
        );
        dataSend.data = {
          dataImage: dataImage,
        };
        break;
      case TwoFactorType.SMS:
        badRequestError({
          i18n,
          lang: i18n.lang,
          description: i18n.t('messages.auth.error.twoFactorSMSDisabled', {
            lang: i18n.lang,
          }),
        });
        break;
      case TwoFactorType.EMAIL:
        const code = await this.otpsService.enableOtps(
          user,
          userSecurity,
          i18n,
        );
        this.mailService.sendMail(
          user.email,
          'Codigo de verificacion para habilitar 2FA',
          'auth-2fa-otp',
          {
            otpCode: code,
            expiryMinutes: 5,
            loginIp: getIPFromRequest(req),
          },
          i18n,
        );
        dataSend.data = {
          message: i18n.t('messages.auth.email2faEnabled', { lang: i18n.lang }),
        };
        break;
      default:
        badRequestError({
          i18n,
          lang: i18n.lang,
          description: i18n.t('messages.auth.error.twoFactorTypeNotSupported', {
            lang: i18n.lang,
          }),
        });
        break;
    }

    return okResponse({
      i18n,
      lang: i18n.lang,
      data: dataSend,
    });
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
      case TwoFactorType.SMS:
        break;
      case TwoFactorType.EMAIL:
        valid = await this.otpsService.verifyOtps(
          user.id,
          TwoFactorOtpsType.EMAIL,
          code,
          i18n,
        );

        this.logger.debug(valid);
        if (valid) {
          userSecurity.twoFactorData = {
            otpsType: TwoFactorOtpsType.EMAIL,
            email: user.email,
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
    await this.auditLogService.create(
      {
        event: AuditEvent.MFA_ENABLED,
        actorId: userId,
        ip: getIPFromRequest(req),
        userAgent: req.headers['user-agent'],
      },
      i18n,
    );

    const recoveryCodes = await this.userSecurityRecoveryCodesService.generate(
      userId,
      i18n,
    );

    return okResponse({
      i18n,
      lang: i18n.lang,
      data: {
        data: {
          message: i18n.t('messages.auth.success.twoFactorEnabled', {
            lang: i18n.lang,
          }),
          recoveryCode: recoveryCodes.data.data,
        },
        total: 0,
      },
    });
  }

  async verify2fa(
    req: Request,
    res: Response,
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
      case TwoFactorType.SMS:
        break;
      case TwoFactorType.EMAIL:
        valid = await this.otpsService.verifyOtps(
          user.id,
          TwoFactorOtpsType.EMAIL,
          code,
          i18n,
        );
    }

    if (!valid && code)
      valid = await this.userSecurityRecoveryCodesService.useCode(
        userId,
        { code },
        i18n,
      );

    if (!valid) {
      await this.attemptsService.recordFailure(
        user.email,
        getIPFromRequest(req),
        i18n,
      );
      badRequestError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.auth.error.wrongCode', {
          lang: i18n.lang,
        }),
      });
    }

    return await this.__generatedTokenAndRefreshToken(
      req,
      res,
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
      userSecurity.twoFactorData = null;
      userSecurity.twoFactorType = null;
      userSecurity.lastChangedAt = new Date();
      await this.securityService.save(userSecurity, i18n);
      await this.auditLogService.create(
        {
          event: AuditEvent.MFA_DISABLED,
          actorId: userId,
          ip: getIPFromRequest(req),
          userAgent: req.headers['user-agent'],
        },
        i18n,
      );
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
    res: Response,
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
          permissions: parsePermissions(user.role.permissions),
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

    await this.attemptsService.reset(user.email, i18n);
    await this.auditLogService.create(
      {
        event: AuditEvent.LOGIN_SUCCESS,
        actorId: user.id,
        ip,
        userAgent,
        metadata: {
          browser,
          os,
          device,
          location,
        },
      },
      i18n,
    );

    const access_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET + user.user_secret,
      expiresIn: '30m',
    });

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: this.isProd,
      sameSite: this.isProd ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.isProd,
      sameSite: this.isProd ? 'none' : 'lax',
      maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
    });

    return okResponse({
      i18n,
      lang: i18n.lang,
      data: {
        data: {
          accessToken: access_token,
          refreshToken,
          email: user.email,
          user: user.name + ' ' + user.lastname,
          role: user.role.name,
          permissions: parsePermissions(user.role.permissions),
        },
        total: 1,
      },
    });
  }

  async resetPasswordLogged(
    req: Request,
    resetPasswordTokenDto: ResetPasswordTokenDto,
    i18n: I18nContext,
  ) {
    const userId = req.user['sub'];
    const sessionId = req.user['sessionId'];
    const email = req.user['email'];

    if (
      resetPasswordTokenDto.password !== resetPasswordTokenDto.password_confirm
    )
      badRequestError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.auth.error.passwordsDoesNotMatch', {
          lang: i18n.lang,
        }),
      });

    await this.dataSource.transaction(async (manager) => {
      await this.credentialsService.updatePassword(
        email,
        resetPasswordTokenDto,
        i18n,
        manager,
      );
      await this.usersService.updatePassword(userId, i18n, manager);
    });

    const loginUrl = process.env.URL_FRONTEND + '/auth/login';
    await this.mailService.sendMail(
      email,
      'Cambio de contraseña exitoso', // Subject o asunto
      'auth-password-success', // Plantilla o template
      {
        loginUrl,
        updateDate: new Date().toLocaleString(),
        updateTime: new Date().toLocaleTimeString(),
      },
      i18n,
    );

    await this.logoutAll(userId, sessionId, i18n);
    await this.auditLogService.create(
      {
        event: AuditEvent.PASSWORD_CHANGED,
        actorId: userId,
        ip: getIPFromRequest(req),
        userAgent: req.headers['user-agent'],
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

  // VERIFICAR SI ES REGISTRO CON OAUTH O ES LINK PARA VINCULAR CON OAUTH
  async handleOAuthCallback(
    req: Request,
    res: Response,
    deviceId: string,
    i18n: I18nContext,
  ) {
    const state = req.query.state;
    const payload = this.oauthStateService.verify(state as string);
    this.logger.log(payload);

    switch (payload.flow) {
      case 'login':
        await this.loginWithOauth(req, res, i18n);
        break;
      case 'link':
        await this.linkOauth(req, res, i18n, payload.userId);
        break;
      default:
        this.logger.error('Invalid flow');
        break;
    }
  }

  async loginWithOauth(req: Request, res: Response, i18n: I18nContext) {
    const deviceId = await ensureDeviceId(req, res);

    const user = await this.dataSource.transaction(async (manager) => {
      const user = await this.usersService.validateOAuthUser(
        req.user as OAuthProfile,
        i18n,
        manager,
      );

      await this.oauthService.create(
        {
          user: user,
          provider: req.user['provider'],
          providerId: req.user['providerId'],
          isActive: req.user['isActive'],
          avatar: req.user['avatar'],
        },
        manager,
      );
      return user;
    });

    const { ip, userAgent, device, location } = await getClientInfo(req);

    const refreshToken = await this.dataSource.transaction<string>(
      async (manager) => {
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
            permissions: parsePermissions(user.role.permissions),
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

        return refreshToken;
      },
    );

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
    });

    return res.redirect(
      process.env.URL_FRONTEND + `/auth/callback?token=${refreshToken}`,
    );
  }

  async linkOauth(
    req: Request,
    res: Response,
    i18n: I18nContext,
    userId: number,
  ) {
    const oath_exist = await this.oauthService.getUserWithProviderAndProviderId(
      req.user['providerId'],
      req.user['provider'],
    );

    if (oath_exist && oath_exist.id !== userId)
      res.redirect(
        process.env.URL_FRONTEND +
          '/dashboard?error=1&message=You are already linked to another account',
      );

    const { data: user } = (await this.usersService.findOne(userId, i18n)).data;
    await this.oauthService.create({
      user: user,
      provider: req.user['provider'],
      providerId: req.user['providerId'],
      isActive: req.user['isActive'],
      avatar: req.user['avatar'],
    });
  }
}
