import { Test, TestingModule } from '@nestjs/testing';
import { TotpService } from './totp.service';
import { SecurityService } from 'src/modules/users/security/security.service';
import { UsersService } from 'src/modules/users/users.service';
import { TwoFactorType } from 'src/common/enum/two-factor-type.enum';
import { UserSecurity } from 'src/modules/users/entities/user-security.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { I18nContext } from 'nestjs-i18n';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

// Mock uuid to avoid ESM parsing issues
jest.mock('uuid', () => ({
  v7: jest.fn(() => 'mock-uuid-v7-token'),
}));

describe('TotpService', () => {
  let service: TotpService;
  let mockSecurityService: any;
  let mockUsersService: any;
  let mockI18n: I18nContext;
  let mockUser: User;
  let mockUserSecurity: UserSecurity;
  let mockSecret: any;
  let mockQrCodeDataUrl: string;

  beforeEach(async () => {
    mockUser = {
      id: 1,
      email: 'test@example.com',
    } as User;

    mockUserSecurity = {
      id: 1,
      user: mockUser,
      twoFactorEnabled: false,
      twoFactorType: TwoFactorType.TOTP,
      twoFactorData: { secret: 'base32secret' },
      recoveryCodes: null,
      recoveryCodesList: [],
      failed_2fa_attempts: 0,
      lockedUntil: null,
      lastChangedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as UserSecurity;

    mockSecret = {
      base32: 'base32secret123',
      otpauth_url:
        'otpauth://totp/Test:test@example.com?secret=base32secret123&issuer=Test',
      ascii: 'asciisecret',
      hex: 'hexsecret',
      google_auth_qr: 'google_qr_data',
    } as any;

    mockQrCodeDataUrl = 'data:image/png;base64,mockqrcode';

    mockSecurityService = {
      findOneByUser: jest.fn(),
      save: jest.fn(),
    } as any;

    mockUsersService = {
      findById: jest.fn(),
    } as any;

    mockI18n = {
      lang: 'en',
      t: jest.fn().mockReturnValue('translated text'),
    } as unknown as I18nContext;

    jest.spyOn(speakeasy, 'generateSecret').mockReturnValue(mockSecret);
    (QRCode as any).toDataURL = jest.fn().mockResolvedValue(mockQrCodeDataUrl);
    jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TotpService,
        {
          provide: SecurityService,
          useValue: mockSecurityService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<TotpService>(TotpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('generateSecret', () => {
    it('should generate TOTP secret successfully', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockSecurityService.findOneByUser.mockResolvedValue(mockUserSecurity);
      mockSecurityService.save.mockResolvedValue(mockUserSecurity);

      const result = await service.generateSecret(
        mockUser.id,
        mockUser.email,
        mockI18n,
      );

      expect(result).toEqual({
        secret: mockSecret.base32,
        otpauth_url: mockSecret.otpauth_url,
      });
      expect(mockUsersService.findById).toHaveBeenCalledWith(
        mockUser.id,
        mockI18n,
      );
      expect(mockSecurityService.findOneByUser).toHaveBeenCalledWith(
        mockUser,
        mockI18n,
      );
      expect(speakeasy.generateSecret).toHaveBeenCalledWith({
        name: `${process.env.NAME_APP} (${mockUser.email})`,
        length: 20,
      });
      expect(mockUserSecurity.twoFactorData).toEqual({
        secret: mockSecret.base32,
      });
      expect(mockSecurityService.save).toHaveBeenCalledWith(
        mockUserSecurity,
        mockI18n,
      );
    });

    it('should use correct app name in secret generation', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockSecurityService.findOneByUser.mockResolvedValue(mockUserSecurity);
      mockSecurityService.save.mockResolvedValue(mockUserSecurity);

      await service.generateSecret(mockUser.id, mockUser.email, mockI18n);

      expect(speakeasy.generateSecret).toHaveBeenCalledWith({
        name: `${process.env.NAME_APP} (${mockUser.email})`,
        length: 20,
      });
    });

    it('should handle error when user not found', async () => {
      mockUsersService.findById.mockRejectedValue(new Error('User not found'));

      await expect(
        service.generateSecret(mockUser.id, mockUser.email, mockI18n),
      ).rejects.toThrow();
    });

    it('should handle error when security not found', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockSecurityService.findOneByUser.mockRejectedValue(
        new Error('Security not found'),
      );

      await expect(
        service.generateSecret(mockUser.id, mockUser.email, mockI18n),
      ).rejects.toThrow();
    });

    it('should handle error when save fails', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockSecurityService.findOneByUser.mockResolvedValue(mockUserSecurity);
      mockSecurityService.save.mockRejectedValue(new Error('Save failed'));

      await expect(
        service.generateSecret(mockUser.id, mockUser.email, mockI18n),
      ).rejects.toThrow();
    });
  });

  describe('generateQrCode', () => {
    it('should generate QR code successfully', async () => {
      const result = await service.generateQrCode(mockSecret.otpauth_url);

      expect(result).toBe(mockQrCodeDataUrl);
      expect(QRCode.toDataURL).toHaveBeenCalledWith(mockSecret.otpauth_url);
    });

    it('should handle error when QR generation fails', async () => {
      (QRCode as any).toDataURL.mockRejectedValue(
        new Error('QR generation failed'),
      );

      await expect(
        service.generateQrCode(mockSecret.otpauth_url),
      ).rejects.toThrow();
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token successfully', async () => {
      const result = await service.verifyToken(mockSecret.base32, '123456');

      expect(result).toBe(true);
      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: mockSecret.base32,
        encoding: 'base32',
        token: '123456',
        window: 1,
      });
    });

    it('should return false for invalid token', async () => {
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(false);

      const result = await service.verifyToken(mockSecret.base32, 'wrong');

      expect(result).toBe(false);
    });

    it('should handle error during verification', async () => {
      jest.spyOn(speakeasy.totp, 'verify').mockImplementation(() => {
        throw new Error('Verification failed');
      });

      await expect(
        service.verifyToken(mockSecret.base32, '123456'),
      ).rejects.toThrow();
    });
  });

  describe('enableTotp', () => {
    it('should enable TOTP successfully', async () => {
      mockSecurityService.save.mockResolvedValue({
        ...mockUserSecurity,
        twoFactorEnabled: false,
        twoFactorType: TwoFactorType.TOTP,
        twoFactorData: { secret: mockSecret },
      });

      const result = await service.enableTotp(
        mockUser.email,
        mockUserSecurity,
        mockI18n,
      );

      expect(result).toEqual({ qrCode: mockQrCodeDataUrl });
      expect(mockUserSecurity.twoFactorEnabled).toBe(false);
      expect(mockUserSecurity.twoFactorType).toBe(TwoFactorType.TOTP);
      expect(mockUserSecurity.twoFactorData).toEqual({
        secret: mockSecret,
        pending: true,
      });
      expect(speakeasy.generateSecret).toHaveBeenCalledWith({
        name: `${process.env.NAME_APP} (${mockUser.email})`,
        issuer: process.env.NAME_APP,
      });
      expect(QRCode.toDataURL).toHaveBeenCalledWith(mockSecret.otpauth_url);
      expect(mockSecurityService.save).toHaveBeenCalledWith(
        mockUserSecurity,
        mockI18n,
      );
    });

    it('should set twoFactorType to TOTP', async () => {
      mockSecurityService.save.mockResolvedValue(mockUserSecurity);

      await service.enableTotp(mockUser.email, mockUserSecurity, mockI18n);

      expect(mockUserSecurity.twoFactorType).toBe(TwoFactorType.TOTP);
    });

    it('should set twoFactorEnabled to false initially', async () => {
      mockSecurityService.save.mockResolvedValue(mockUserSecurity);

      await service.enableTotp(mockUser.email, mockUserSecurity, mockI18n);

      expect(mockUserSecurity.twoFactorEnabled).toBe(false);
    });

    it('should store secret with pending flag', async () => {
      mockSecurityService.save.mockResolvedValue(mockUserSecurity);

      await service.enableTotp(mockUser.email, mockUserSecurity, mockI18n);

      expect(mockUserSecurity.twoFactorData).toEqual({
        secret: mockSecret,
        pending: true,
      });
    });

    it('should handle error when save fails', async () => {
      mockSecurityService.save.mockRejectedValue(new Error('Save failed'));

      await expect(
        service.enableTotp(mockUser.email, mockUserSecurity, mockI18n),
      ).rejects.toThrow();
    });

    it('should handle error when QR generation fails', async () => {
      mockSecurityService.save.mockResolvedValue(mockUserSecurity);
      (QRCode as any).toDataURL.mockRejectedValue(new Error('QR failed'));

      await expect(
        service.enableTotp(mockUser.email, mockUserSecurity, mockI18n),
      ).rejects.toThrow();
    });

    it('should generate secret with issuer', async () => {
      mockSecurityService.save.mockResolvedValue(mockUserSecurity);

      await service.enableTotp(mockUser.email, mockUserSecurity, mockI18n);

      expect(speakeasy.generateSecret).toHaveBeenCalledWith({
        name: `${process.env.NAME_APP} (${mockUser.email})`,
        issuer: process.env.NAME_APP,
      });
    });
  });
});
