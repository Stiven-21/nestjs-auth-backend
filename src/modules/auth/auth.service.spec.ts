import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from 'src/modules/users/users.service';
import { SecurityService } from 'src/modules/users/security/security.service';
import { TokensService } from 'src/modules/users/tokens/tokens.service';
import { SessionService } from 'src/modules/users/session/session.service';
import { MailService } from 'src/mails/mail.service';
import { JwtService } from '@nestjs/jwt';
import { CredentialsService } from 'src/modules/users/credentials/credentials.service';
import { DataSource } from 'typeorm';
import { AuthSessionsService } from 'src/modules/auth/sessions/sessions.service';
import { AuthRefreshTokensService } from 'src/modules/auth/refresh-tokens/refresh-tokens.service';
import { SecurityRecoveryCodesService } from 'src/modules/users/security-recovery-codes/security-recovery-codes.service';
import { AttemptsService } from 'src/modules/auth/attempts/attempts.service';
import { TotpService } from 'src/modules/users/security/totp/totp.service';
import { OtpsService } from 'src/modules/users/security/otps/otps.service';
import { AuditLogService } from 'src/modules/audit-log/audit-log.service';
import { OAuthService } from 'src/modules/users/oauth/oauth.service';
import { OAuthStateService } from 'src/modules/auth/oauth/oauth.service';
import { PinoLogger } from 'nestjs-pino';
import frontendConfig from 'src/config/frontend.config';
import { I18nContext } from 'nestjs-i18n';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');
jest.mock('uuid', () => ({
  v7: jest.fn().mockReturnValue('mocked-uuid'),
}));
jest.mock('src/common/helpers/request-info.helper', () => ({
  getClientInfo: jest.fn().mockResolvedValue({
    ip: '127.0.0.1',
    userAgent: 'mock-ua',
    browser: 'mock-browser',
    os: 'mock-os',
    device: 'mock-device',
    location: null,
  }),
  getIPFromRequest: jest.fn().mockReturnValue('127.0.0.1'),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    create: jest.fn(),
    verifyEmail: jest.fn(),
    findOneByEmail: jest.fn(),
    findById: jest.fn(),
    updatePassword: jest.fn(),
  };
  const mockSecurityService = {
    create: jest.fn(),
    findOneByUser: jest.fn(),
    save: jest.fn(),
  };
  const mockTokensService = {
    createTokenEmailVerification: jest.fn(),
    createTokenPasswordReset: jest.fn(),
    findOneByToken: jest.fn(),
    updateTokenIsUsed: jest.fn(),
  };
  const mockSessionService = { create: jest.fn() };
  const mockMailService = { sendMail: jest.fn() };
  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
    decode: jest.fn(),
  };
  const mockCredentialsService = {
    create: jest.fn(),
    updatePassword: jest.fn(),
    findCredentialsOfUser: jest.fn(),
  };
  const mockAuthSessionsService = {
    createAuthSession: jest.fn(),
    updateActive: jest.fn(),
    findByDeviceId: jest.fn(),
    findBySessionId: jest.fn(),
    updateInactiveUserId: jest.fn(),
  };
  const mockAuthRefreshTokensService = {
    revokeTokenWithSessionId: jest.fn(),
    revokeTokenWithUserId: jest.fn(),
    revokeRefreshToken: jest.fn(),
    createRefreshToken: jest.fn(),
  };
  const mockSecurityRecoveryCodesService = {
    generate: jest.fn(),
    useCode: jest.fn(),
  };
  const mockAttemptsService = { recordFailure: jest.fn(), reset: jest.fn() };
  const mockTotpService = { enableTotp: jest.fn(), verifyToken: jest.fn() };
  const mockOtpsService = {
    createOtp: jest.fn(),
    enableOtps: jest.fn(),
    verifyOtps: jest.fn(),
  };
  const mockAuditLogService = { create: jest.fn() };
  const mockOAuthService = {
    create: jest.fn(),
    getUserWithProviderAndProviderId: jest.fn(),
    findAllOAuthWithUser: jest.fn(),
    delete: jest.fn(),
  };
  const mockOAuthStateService = { verify: jest.fn() };
  const mockLogger = {
    setContext: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  const mockEntityManager = {
    getRepository: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn((cb) => cb(mockEntityManager)),
  };

  const mockI18n = {
    t: jest.fn().mockReturnValue('translated text'),
    lang: 'es',
  } as unknown as I18nContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: frontendConfig.KEY,
          useValue: { url: 'http://localhost', paths: { login: '/login' } },
        },
        { provide: UsersService, useValue: mockUsersService },
        { provide: SecurityService, useValue: mockSecurityService },
        { provide: TokensService, useValue: mockTokensService },
        { provide: SessionService, useValue: mockSessionService },
        { provide: MailService, useValue: mockMailService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: CredentialsService, useValue: mockCredentialsService },
        { provide: DataSource, useValue: mockDataSource },
        { provide: AuthSessionsService, useValue: mockAuthSessionsService },
        {
          provide: AuthRefreshTokensService,
          useValue: mockAuthRefreshTokensService,
        },
        {
          provide: SecurityRecoveryCodesService,
          useValue: mockSecurityRecoveryCodesService,
        },
        { provide: AttemptsService, useValue: mockAttemptsService },
        { provide: TotpService, useValue: mockTotpService },
        { provide: OtpsService, useValue: mockOtpsService },
        { provide: AuditLogService, useValue: mockAuditLogService },
        { provide: OAuthService, useValue: mockOAuthService },
        { provide: OAuthStateService, useValue: mockOAuthStateService },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password',
      } as any;
      const user = { id: 1, createdAt: new Date() };
      mockUsersService.create.mockResolvedValue(user);

      const result = await service.register(registerDto, mockI18n);

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          meta: expect.objectContaining({ action: 'SUCCESS_REGISTER' }),
        }),
      );
      expect(mockUsersService.create).toHaveBeenCalled();
      expect(mockCredentialsService.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login successfully when 2FA is disabled', async () => {
      const loginDto = { email: 'test@example.com', password: 'password' };
      const user = {
        id: 1,
        email: 'test@example.com',
        password: 'hashed_password',
        role: { name: 'user', permissions: [] },
      };
      const req = {
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
      } as any;
      const res = { cookie: jest.fn() } as any;

      mockUsersService.findOneByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockSecurityService.findOneByUser.mockResolvedValue({
        twoFactorEnabled: false,
      });
      mockJwtService.sign.mockReturnValue('mock_token');
      mockAuthSessionsService.createAuthSession.mockResolvedValue({ id: 1 });
      mockAuthRefreshTokensService.createRefreshToken.mockResolvedValue({});

      const result = await service.login(
        req,
        res,
        loginDto,
        'device-id',
        mockI18n,
      );

      expect(result.success).toBe(true);
      // El refreshToken se retorna en el body (no en cookie) para el login normal
      expect(result.data).toHaveProperty('refreshToken');
    });

    it('should throw error on invalid password', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrong_password',
      };
      const user = { email: 'test@example.com', password: 'hashed_password' };

      mockUsersService.findOneByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({} as any, {} as any, loginDto, 'device-id', mockI18n),
      ).rejects.toThrow();
    });
  });
});
