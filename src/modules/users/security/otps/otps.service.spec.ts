import { Test, TestingModule } from '@nestjs/testing';
import { OtpsService } from './otps.service';
import { UserSecurityTwoFactorOtps } from 'src/modules/users/entities/user-security-two-factor-otps.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { UserSecurity } from 'src/modules/users/entities/user-security.entity';
import { TwoFactorOtpsType } from 'src/common/enum/two-factor-otps.enum';
import { TwoFactorType } from 'src/common/enum/two-factor-type.enum';
import { I18nContext } from 'nestjs-i18n';
import { SecurityService } from 'src/modules/users/security/security.service';
import * as crypto from 'crypto';

describe('OtpsService', () => {
  let service: OtpsService;
  let mockUserSecurityTwoFactorOtpsRepository: any;
  let mockSecurityService: any;
  let mockI18n: I18nContext;
  let mockUser: User;
  let mockUserSecurity: UserSecurity;
  let mockOtp: UserSecurityTwoFactorOtps;
  let mockExpiredOtp: UserSecurityTwoFactorOtps;
  let mockUpdateResult: any;

  beforeEach(async () => {
    mockUser = {
      id: 1,
      email: 'test@example.com',
    } as User;

    mockUserSecurity = {
      id: 1,
      user: mockUser,
      twoFactorEnabled: false,
      twoFactorType: TwoFactorType.EMAIL,
      twoFactorData: null,
      recoveryCodes: null,
      failed_2fa_attempts: 0,
      lockedUntil: null,
      lastChangedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as UserSecurity;

    mockOtp = {
      id: 1,
      user: mockUser,
      type: TwoFactorOtpsType.EMAIL,
      code: 'hashed_code',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      used: false,
      failedAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as UserSecurityTwoFactorOtps;

    mockExpiredOtp = {
      ...mockOtp,
      expiresAt: new Date(Date.now() - 60000), // 1 minute ago
    } as UserSecurityTwoFactorOtps;

    mockUpdateResult = {
      affected: 1,
      raw: {},
      generatedMaps: [],
    };

    mockUserSecurityTwoFactorOtpsRepository = {
      save: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockSecurityService = {
      findOneByUser: jest.fn(),
      save: jest.fn(),
    } as any;

    mockI18n = {
      lang: 'en',
      t: jest.fn().mockReturnValue('translated text'),
    } as unknown as I18nContext;

    jest
      .spyOn(crypto, 'randomBytes')
      .mockReturnValue({ toString: () => 'ABC123' } as any);
    jest.spyOn(crypto, 'createHash').mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: () => 'hashed_code',
    } as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpsService,
        {
          provide: SecurityService,
          useValue: mockSecurityService,
        },
        {
          provide: 'UserSecurityTwoFactorOtpsRepository',
          useValue: mockUserSecurityTwoFactorOtpsRepository,
        },
      ],
    }).compile();

    service = module.get<OtpsService>(OtpsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('createOtp', () => {
    it('should create OTP successfully', async () => {
      mockUserSecurityTwoFactorOtpsRepository.update.mockResolvedValue(
        mockUpdateResult,
      );
      mockUserSecurityTwoFactorOtpsRepository.save.mockResolvedValue(mockOtp);

      const result = await service.createOtp(
        mockUser,
        TwoFactorOtpsType.EMAIL,
        mockI18n,
      );

      expect(result).toBe('ABC123');
      expect(
        mockUserSecurityTwoFactorOtpsRepository.update,
      ).toHaveBeenCalledWith(
        {
          user: { id: mockUser.id },
          type: TwoFactorOtpsType.EMAIL,
          used: false,
        },
        { used: true },
      );
      expect(mockUserSecurityTwoFactorOtpsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser,
          type: TwoFactorOtpsType.EMAIL,
          code: 'hashed_code',
          expiresAt: expect.any(Date),
        }),
      );
    });

    it('should mark previous unused OTPs as used before creating new one', async () => {
      mockUserSecurityTwoFactorOtpsRepository.update.mockResolvedValue(
        mockUpdateResult,
      );
      mockUserSecurityTwoFactorOtpsRepository.save.mockResolvedValue(mockOtp);

      await service.createOtp(mockUser, TwoFactorOtpsType.EMAIL, mockI18n);

      expect(
        mockUserSecurityTwoFactorOtpsRepository.update,
      ).toHaveBeenCalledWith(
        {
          user: { id: mockUser.id },
          type: TwoFactorOtpsType.EMAIL,
          used: false,
        },
        { used: true },
      );
    });

    it('should handle error during update', async () => {
      mockUserSecurityTwoFactorOtpsRepository.update.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(
        service.createOtp(mockUser, TwoFactorOtpsType.EMAIL, mockI18n),
      ).rejects.toThrow();
    });

    it('should handle error during save', async () => {
      mockUserSecurityTwoFactorOtpsRepository.update.mockResolvedValue(
        mockUpdateResult,
      );
      mockUserSecurityTwoFactorOtpsRepository.save.mockRejectedValue(
        new Error('Save failed'),
      );

      await expect(
        service.createOtp(mockUser, TwoFactorOtpsType.EMAIL, mockI18n),
      ).rejects.toThrow();
    });

    it('should generate hashed code', async () => {
      mockUserSecurityTwoFactorOtpsRepository.update.mockResolvedValue(
        mockUpdateResult,
      );
      mockUserSecurityTwoFactorOtpsRepository.save.mockResolvedValue(mockOtp);

      await service.createOtp(mockUser, TwoFactorOtpsType.EMAIL, mockI18n);

      expect(crypto.createHash).toHaveBeenCalledWith('sha256');
    });

    it('should generate 6-character code', async () => {
      mockUserSecurityTwoFactorOtpsRepository.update.mockResolvedValue(
        mockUpdateResult,
      );
      mockUserSecurityTwoFactorOtpsRepository.save.mockResolvedValue(mockOtp);

      await service.createOtp(mockUser, TwoFactorOtpsType.EMAIL, mockI18n);

      const saveCall =
        mockUserSecurityTwoFactorOtpsRepository.save.mock.calls[0][0];
      expect(saveCall.code).toBe('hashed_code');
      // Verify the original code was 6 characters (3 bytes = 6 hex chars)
      expect(crypto.randomBytes).toHaveBeenCalledWith(3);
    });

    it('should set expiration to 5 minutes from now', async () => {
      mockUserSecurityTwoFactorOtpsRepository.update.mockResolvedValue(
        mockUpdateResult,
      );
      mockUserSecurityTwoFactorOtpsRepository.save.mockResolvedValue(mockOtp);

      await service.createOtp(mockUser, TwoFactorOtpsType.EMAIL, mockI18n);

      const saveCall =
        mockUserSecurityTwoFactorOtpsRepository.save.mock.calls[0][0];
      const expectedExpiry = new Date(Date.now() + 5 * 60 * 1000);
      expect((saveCall.expiresAt as Date).getTime()).toBeCloseTo(
        expectedExpiry.getTime(),
        -3,
      );
    });
  });

  describe('verifyOtps', () => {
    it('should verify valid OTP successfully', async () => {
      mockUserSecurityTwoFactorOtpsRepository.findOne.mockResolvedValue(
        mockOtp,
      );
      const savedOtp = {
        ...mockOtp,
        used: true,
        failedAttempts: 1, // Incremented in service
      };
      mockUserSecurityTwoFactorOtpsRepository.save.mockResolvedValue(savedOtp);

      const result = await service.verifyOtps(
        mockUser.id,
        TwoFactorOtpsType.EMAIL,
        'ABC123',
        mockI18n,
      );

      expect(result).toBe(true);
      expect(
        mockUserSecurityTwoFactorOtpsRepository.findOne,
      ).toHaveBeenCalledWith({
        where: {
          user: { id: mockUser.id },
          type: TwoFactorOtpsType.EMAIL,
          used: false,
        },
        order: { createdAt: 'DESC' },
      });
      expect(mockUserSecurityTwoFactorOtpsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          used: true,
          failedAttempts: 1,
        }),
      );
    });

    it('should return false when OTP does not exist', async () => {
      mockUserSecurityTwoFactorOtpsRepository.findOne.mockResolvedValue(null);

      const result = await service.verifyOtps(
        mockUser.id,
        TwoFactorOtpsType.EMAIL,
        'ABC123',
        mockI18n,
      );

      expect(result).toBe(false);
    });

    it('should return false when OTP is expired', async () => {
      mockUserSecurityTwoFactorOtpsRepository.findOne.mockResolvedValue(
        mockExpiredOtp,
      );

      const result = await service.verifyOtps(
        mockUser.id,
        TwoFactorOtpsType.EMAIL,
        'ABC123',
        mockI18n,
      );

      expect(result).toBe(false);
    });

    it('should increment failed attempts on wrong code', async () => {
      mockOtp.failedAttempts = 0;
      // Set the stored OTP code to a different hash so verification fails
      mockOtp.code = 'different_hash';
      mockUserSecurityTwoFactorOtpsRepository.findOne.mockResolvedValue(
        mockOtp,
      );
      mockUserSecurityTwoFactorOtpsRepository.save.mockResolvedValue({
        ...mockOtp,
        failedAttempts: 1,
      } as any);

      const result = await service.verifyOtps(
        mockUser.id,
        TwoFactorOtpsType.EMAIL,
        'DIFFERENT',
        mockI18n,
      );

      expect(result).toBe(false);
      expect(mockOtp.failedAttempts).toBe(1);
    });

    it('should throw error when failed attempts reach 5', async () => {
      mockOtp.failedAttempts = 4;
      mockUserSecurityTwoFactorOtpsRepository.findOne.mockResolvedValue(
        mockOtp,
      );

      await expect(
        service.verifyOtps(
          mockUser.id,
          TwoFactorOtpsType.EMAIL,
          'WRONG',
          mockI18n,
        ),
      ).rejects.toThrow();

      expect(mockUserSecurityTwoFactorOtpsRepository.save).toHaveBeenCalled();
    });

    it('should increment failed attempts even on successful verification (service behavior)', async () => {
      mockOtp.failedAttempts = 2;
      mockUserSecurityTwoFactorOtpsRepository.findOne.mockResolvedValue(
        mockOtp,
      );
      mockUserSecurityTwoFactorOtpsRepository.save.mockResolvedValue({
        ...mockOtp,
        used: true,
        failedAttempts: 3, // Service increments before checking code
      } as any);

      await service.verifyOtps(
        mockUser.id,
        TwoFactorOtpsType.EMAIL,
        'ABC123',
        mockI18n,
      );

      const savedOtp =
        mockUserSecurityTwoFactorOtpsRepository.save.mock.calls[0][0];
      expect(savedOtp.failedAttempts).toBe(3);
    });

    it('should handle error when findOne fails', async () => {
      mockUserSecurityTwoFactorOtpsRepository.findOne.mockRejectedValue(
        new Error('Find failed'),
      );

      await expect(
        service.verifyOtps(
          mockUser.id,
          TwoFactorOtpsType.EMAIL,
          'ABC123',
          mockI18n,
        ),
      ).rejects.toThrow();
    });

    it('should handle error when save fails after verification', async () => {
      mockUserSecurityTwoFactorOtpsRepository.findOne.mockResolvedValue(
        mockOtp,
      );
      mockUserSecurityTwoFactorOtpsRepository.save.mockRejectedValue(
        new Error('Save failed'),
      );

      await expect(
        service.verifyOtps(
          mockUser.id,
          TwoFactorOtpsType.EMAIL,
          'ABC123',
          mockI18n,
        ),
      ).rejects.toThrow();
    });
  });

  describe('enableOtps', () => {
    it('should enable OTP successfully', async () => {
      mockSecurityService.findOneByUser.mockResolvedValue(mockUserSecurity);
      mockUserSecurityTwoFactorOtpsRepository.save.mockResolvedValue({
        ...mockOtp,
        type: TwoFactorOtpsType.EMAIL,
      });
      mockSecurityService.save.mockResolvedValue({
        ...mockUserSecurity,
        twoFactorEnabled: false,
        twoFactorType: TwoFactorType.EMAIL,
      });

      const result = await service.enableOtps(
        mockUser,
        mockUserSecurity,
        mockI18n,
      );

      expect(result).toBe('ABC123');
      expect(mockUserSecurity.twoFactorEnabled).toBe(false);
      expect(mockUserSecurity.twoFactorType).toBe(TwoFactorType.EMAIL);
      expect(mockSecurityService.save).toHaveBeenCalledWith(
        mockUserSecurity,
        mockI18n,
      );
    });

    it('should create OTP during enable', async () => {
      mockSecurityService.findOneByUser.mockResolvedValue(mockUserSecurity);
      mockUserSecurityTwoFactorOtpsRepository.save.mockResolvedValue(mockOtp);
      mockSecurityService.save.mockResolvedValue(mockUserSecurity);

      await service.enableOtps(mockUser, mockUserSecurity, mockI18n);

      expect(mockUserSecurityTwoFactorOtpsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser,
          type: TwoFactorOtpsType.EMAIL,
        }),
      );
    });

    it('should handle error when creating OTP fails', async () => {
      mockSecurityService.findOneByUser.mockResolvedValue(mockUserSecurity);
      mockUserSecurityTwoFactorOtpsRepository.save.mockRejectedValue(
        new Error('Save failed'),
      );

      await expect(
        service.enableOtps(mockUser, mockUserSecurity, mockI18n),
      ).rejects.toThrow();
    });

    it('should handle error when saving security fails', async () => {
      mockSecurityService.findOneByUser.mockResolvedValue(mockUserSecurity);
      mockUserSecurityTwoFactorOtpsRepository.save.mockResolvedValue(mockOtp);
      mockSecurityService.save.mockRejectedValue(new Error('Save failed'));

      await expect(
        service.enableOtps(mockUser, mockUserSecurity, mockI18n),
      ).rejects.toThrow();
    });

    it('should set twoFactorType to EMAIL', async () => {
      mockSecurityService.findOneByUser.mockResolvedValue(mockUserSecurity);
      mockUserSecurityTwoFactorOtpsRepository.save.mockResolvedValue(mockOtp);
      mockSecurityService.save.mockResolvedValue(mockUserSecurity);

      await service.enableOtps(mockUser, mockUserSecurity, mockI18n);

      expect(mockUserSecurity.twoFactorType).toBe(TwoFactorType.EMAIL);
    });

    it('should set twoFactorEnabled to false initially', async () => {
      mockSecurityService.findOneByUser.mockResolvedValue(mockUserSecurity);
      mockUserSecurityTwoFactorOtpsRepository.save.mockResolvedValue(mockOtp);
      mockSecurityService.save.mockResolvedValue(mockUserSecurity);

      await service.enableOtps(mockUser, mockUserSecurity, mockI18n);

      expect(mockUserSecurity.twoFactorEnabled).toBe(false);
    });
  });
});
