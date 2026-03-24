import { Test, TestingModule } from '@nestjs/testing';
import { SecurityRecoveryCodesService } from './security-recovery-codes.service';
import { UserSecurityRecoveryCodes } from 'src/modules/users/entities/user-security-recovery-codes.entity';
import { UserSecurity } from 'src/modules/users/entities/user-security.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { UsersService } from 'src/modules/users/users.service';
import { SecurityService } from 'src/modules/users/security/security.service';
// import { UseSecurityRecoveryCodeDto } from 'src/modules/users/dto/use-security-recovery-code.dto'; // Used in type only
import { I18nContext } from 'nestjs-i18n';
import * as crypto from 'crypto';

// Mock uuid to avoid ESM parsing issues
jest.mock('uuid', () => ({
  v7: jest.fn(() => 'mock-uuid-v7-token'),
}));

describe('SecurityRecoveryCodesService', () => {
  let service: SecurityRecoveryCodesService;
  let mockSecurityRecoveryCodesRepository: any;
  let mockUsersService: any;
  let mockSecurityService: any;
  let mockI18n: I18nContext;
  let mockUser: User;
  let mockUserSecurity: UserSecurity;
  let mockRecoveryCode: UserSecurityRecoveryCodes;
  let mockUsedRecoveryCode: UserSecurityRecoveryCodes;
  let mockUpdateResult: any;

  beforeEach(async () => {
    mockUser = {
      id: 1,
      email: 'test@example.com',
    } as User;

    mockUserSecurity = {
      id: 1,
      user: mockUser,
      twoFactorEnabled: true,
      twoFactorType: null,
      twoFactorData: null,
      recoveryCodes: null,
      recoveryCodesList: [],
      failed_2fa_attempts: 0,
      lockedUntil: null,
      lastChangedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as UserSecurity;

    mockRecoveryCode = {
      id: 1,
      userSecurity: mockUserSecurity,
      code: 'ABC123',
      used: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as UserSecurityRecoveryCodes;

    mockUsedRecoveryCode = {
      ...mockRecoveryCode,
      used: true,
    } as UserSecurityRecoveryCodes;

    mockUpdateResult = { affected: 1, raw: {}, generatedMaps: [] };

    mockSecurityRecoveryCodesRepository = {
      save: jest.fn() as any,
      delete: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    } as any;

    mockUsersService = {
      findById: jest.fn(),
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityRecoveryCodesService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: SecurityService,
          useValue: mockSecurityService,
        },
        {
          provide: 'UserSecurityRecoveryCodesRepository',
          useValue: mockSecurityRecoveryCodesRepository,
        },
      ],
    }).compile();

    service = module.get<SecurityRecoveryCodesService>(
      SecurityRecoveryCodesService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generate', () => {
    it('should generate recovery codes successfully when 2FA is enabled', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockSecurityService.findOneByUser.mockResolvedValue(mockUserSecurity);
      mockSecurityRecoveryCodesRepository.delete.mockResolvedValue(
        mockUpdateResult,
      );
      mockSecurityRecoveryCodesRepository.save.mockResolvedValue([
        mockRecoveryCode,
      ]);

      const result = await service.generate(mockUser.id, mockI18n);

      expect(result).toEqual({
        success: true,
        data: expect.arrayContaining([
          'ABC123',
          'ABC123',
          'ABC123',
          'ABC123',
          'ABC123',
          'ABC123',
          'ABC123',
          'ABC123',
          'ABC123',
          'ABC123',
        ]),
        meta: { total: 10 },
        error: null,
      });
      expect(mockSecurityRecoveryCodesRepository.delete).toHaveBeenCalledWith({
        userSecurity: { id: mockUserSecurity.id },
      });
      expect(mockSecurityRecoveryCodesRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'ABC123',
            userSecurity: mockUserSecurity,
          }),
        ]),
      );
    });

    it('should throw error if 2FA is not enabled', async () => {
      mockUserSecurity.twoFactorEnabled = false;
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockSecurityService.findOneByUser.mockResolvedValue(mockUserSecurity);

      await expect(service.generate(mockUser.id, mockI18n)).rejects.toThrow();
    });

    it('should delete old recovery codes before generating new ones', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockSecurityService.findOneByUser.mockResolvedValue(mockUserSecurity);
      mockSecurityRecoveryCodesRepository.delete.mockResolvedValue(
        mockUpdateResult,
      );
      mockSecurityRecoveryCodesRepository.save.mockResolvedValue([
        mockRecoveryCode,
      ]);

      await service.generate(mockUser.id, mockI18n);

      expect(mockSecurityRecoveryCodesRepository.delete).toHaveBeenCalledWith({
        userSecurity: { id: mockUserSecurity.id },
      });
    });

    it('should generate exactly 10 codes', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockSecurityService.findOneByUser.mockResolvedValue(mockUserSecurity);
      mockSecurityRecoveryCodesRepository.delete.mockResolvedValue(
        mockUpdateResult,
      );
      mockSecurityRecoveryCodesRepository.save.mockResolvedValue([]);

      const result = await service.generate(mockUser.id, mockI18n);

      expect(result.data).toHaveLength(10);
      expect(result.meta.total).toBe(10);
    });

    it('should handle error when user not found', async () => {
      mockUsersService.findById.mockRejectedValue(new Error('User not found'));

      await expect(service.generate(mockUser.id, mockI18n)).rejects.toThrow();
    });

    it('should handle error when security not found', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockSecurityService.findOneByUser.mockRejectedValue(
        new Error('Security not found'),
      );

      await expect(service.generate(mockUser.id, mockI18n)).rejects.toThrow();
    });

    it('should handle error when delete fails', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockSecurityService.findOneByUser.mockResolvedValue(mockUserSecurity);
      mockSecurityRecoveryCodesRepository.delete.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(service.generate(mockUser.id, mockI18n)).rejects.toThrow();
    });

    it('should handle error when save fails', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockSecurityService.findOneByUser.mockResolvedValue(mockUserSecurity);
      mockSecurityRecoveryCodesRepository.delete.mockResolvedValue(
        mockUpdateResult,
      );
      mockSecurityRecoveryCodesRepository.save.mockRejectedValue(
        new Error('Save failed'),
      );

      await expect(service.generate(mockUser.id, mockI18n)).rejects.toThrow();
    });
  });

  describe('useCode', () => {
    it('should successfully use valid recovery code', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockSecurityService.findOneByUser.mockResolvedValue(mockUserSecurity);
      mockSecurityRecoveryCodesRepository.findOne.mockResolvedValue(
        mockRecoveryCode,
      );
      mockSecurityRecoveryCodesRepository.save.mockResolvedValue(
        mockUsedRecoveryCode,
      );

      const useSecurityRecoveryCodeDto = { code: 'ABC123' };
      const result = await service.useCode(
        mockUser.id,
        useSecurityRecoveryCodeDto,
        mockI18n,
      );

      expect(result).toBe(true);
      expect(mockRecoveryCode.used).toBe(true);
      expect(mockSecurityRecoveryCodesRepository.save).toHaveBeenCalledWith(
        mockRecoveryCode,
      );
    });

    it('should return false for non-existent recovery code', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockSecurityService.findOneByUser.mockResolvedValue(mockUserSecurity);
      mockSecurityRecoveryCodesRepository.findOne.mockResolvedValue(null);

      const useSecurityRecoveryCodeDto = { code: 'INVALID' };
      const result = await service.useCode(
        mockUser.id,
        useSecurityRecoveryCodeDto,
        mockI18n,
      );

      expect(result).toBe(false);
    });

    it('should return false for already used recovery code', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockSecurityService.findOneByUser.mockResolvedValue(mockUserSecurity);
      mockSecurityRecoveryCodesRepository.findOne.mockResolvedValue(
        mockUsedRecoveryCode,
      );

      const useSecurityRecoveryCodeDto = { code: 'ABC123' };
      const result = await service.useCode(
        mockUser.id,
        useSecurityRecoveryCodeDto,
        mockI18n,
      );

      expect(result).toBe(false);
    });

    it('should trim code before searching', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockSecurityService.findOneByUser.mockResolvedValue(mockUserSecurity);
      mockSecurityRecoveryCodesRepository.findOne.mockResolvedValue(
        mockRecoveryCode,
      );
      mockSecurityRecoveryCodesRepository.save.mockResolvedValue(
        mockUsedRecoveryCode,
      );

      const useSecurityRecoveryCodeDto = { code: '  ABC123  ' };
      await service.useCode(mockUser.id, useSecurityRecoveryCodeDto, mockI18n);

      expect(mockSecurityRecoveryCodesRepository.findOne).toHaveBeenCalledWith({
        where: { code: 'ABC123', userSecurity: { id: mockUserSecurity.id } },
        relations: ['userSecurity'],
      });
    });

    it('should handle error when user not found', async () => {
      mockUsersService.findById.mockRejectedValue(new Error('User not found'));

      await expect(
        service.useCode(mockUser.id, { code: 'ABC123' }, mockI18n),
      ).rejects.toThrow();
    });

    it('should handle error when security not found', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockSecurityService.findOneByUser.mockRejectedValue(
        new Error('Security not found'),
      );

      await expect(
        service.useCode(mockUser.id, { code: 'ABC123' }, mockI18n),
      ).rejects.toThrow();
    });

    it('should handle error when findOne fails', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockSecurityService.findOneByUser.mockResolvedValue(mockUserSecurity);
      mockSecurityRecoveryCodesRepository.findOne.mockRejectedValue(
        new Error('Find failed'),
      );

      await expect(
        service.useCode(mockUser.id, { code: 'ABC123' }, mockI18n),
      ).rejects.toThrow();
    });

    it('should handle error when save fails', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockSecurityService.findOneByUser.mockResolvedValue(mockUserSecurity);
      mockSecurityRecoveryCodesRepository.findOne.mockResolvedValue(
        mockRecoveryCode,
      );
      mockSecurityRecoveryCodesRepository.save.mockRejectedValue(
        new Error('Save failed'),
      );

      await expect(
        service.useCode(mockUser.id, { code: 'ABC123' }, mockI18n),
      ).rejects.toThrow();
    });
  });
});
