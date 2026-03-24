import { Test, TestingModule } from '@nestjs/testing';
import { OAuthService } from './oauth.service';
import { UserAccountOAuth } from 'src/modules/users/entities/user-account-oauth.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { OAuthProviderEnum } from 'src/common/enum/user-oauth-providers.enum';
import { CreateOAuthDto } from 'src/modules/users/dto/create-oauth.dto';
import { I18nContext } from 'nestjs-i18n';
import { UsersService } from 'src/modules/users/users.service';
import { Repository } from 'typeorm';

// Mock uuid to avoid ESM errors in Jest
jest.mock('uuid', () => ({
  v7: jest.fn().mockReturnValue('mocked-uuid'),
}));

describe('OAuthService', () => {
  let service: OAuthService;
  let mockOAuthRepository: jest.Mocked<Repository<UserAccountOAuth>>;
  let mockUserService: jest.Mocked<UsersService>;
  let mockI18n: I18nContext;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
  } as User;

  const mockOAuth = {
    id: 1,
    provider: OAuthProviderEnum.GOOGLE,
    providerId: 'google-123',
    user: mockUser,
    avatar: 'avatar.jpg',
    isActive: true,
    createdAt: new Date(),
  } as UserAccountOAuth;

  const mockCreateOAuthDto: CreateOAuthDto = {
    provider: OAuthProviderEnum.GOOGLE,
    providerId: 'google-123',
    user: mockUser,
    avatar: 'avatar.jpg',
    isActive: true,
  };

  beforeEach(async () => {
    mockOAuthRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    } as any;

    mockUserService = {
      findById: jest.fn(),
      findOne: jest.fn(),
    } as any;

    mockI18n = {
      lang: 'en',
      t: jest.fn().mockReturnValue('translated text'),
    } as unknown as I18nContext;

    // Mock I18nContext.current() for methods that use it
    jest.spyOn(I18nContext, 'current').mockReturnValue(mockI18n as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthService,
        {
          provide: UsersService,
          useValue: mockUserService,
        },
        {
          provide: 'UserAccountOAuthRepository',
          useValue: mockOAuthRepository,
        },
      ],
    }).compile();

    service = module.get<OAuthService>(OAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create OAuth connection successfully', async () => {
      mockOAuthRepository.findOne.mockResolvedValue(null);
      mockOAuthRepository.save.mockResolvedValue(mockOAuth);

      const result = await service.create(mockCreateOAuthDto);

      expect(result).toBeUndefined();
      expect(mockOAuthRepository.findOne).toHaveBeenCalledWith({
        where: {
          providerId: mockCreateOAuthDto.providerId,
          provider: mockCreateOAuthDto.provider,
        },
      });
      expect(mockOAuthRepository.save).toHaveBeenCalledWith(mockCreateOAuthDto);
    });

    it('should not create OAuth if already exists', async () => {
      mockOAuthRepository.findOne.mockResolvedValue(mockOAuth);

      const result = await service.create(mockCreateOAuthDto);

      expect(result).toBeUndefined();
      expect(mockOAuthRepository.save).not.toHaveBeenCalled();
    });

    it('should handle error when findOne fails', async () => {
      mockOAuthRepository.findOne.mockRejectedValue(new Error('Find failed'));

      await expect(service.create(mockCreateOAuthDto)).rejects.toThrow();
    });

    it('should handle error when save fails', async () => {
      mockOAuthRepository.findOne.mockResolvedValue(null);
      mockOAuthRepository.save.mockRejectedValue(new Error('Save failed'));

      await expect(service.create(mockCreateOAuthDto)).rejects.toThrow();
    });

    it('should use transaction manager when provided', async () => {
      const mockTransactionRepo = {
        save: jest.fn(),
        findOne: jest.fn(),
      } as any;

      const mockManager = {
        getRepository: jest.fn().mockReturnValue(mockTransactionRepo),
      } as any;

      mockTransactionRepo.findOne.mockResolvedValue(null);
      mockTransactionRepo.save.mockResolvedValue(mockOAuth);

      await service.create(mockCreateOAuthDto, mockManager);

      // Verify manager's repository is used for save
      expect(mockManager.getRepository).toHaveBeenCalledWith(UserAccountOAuth);
      expect(mockTransactionRepo.save).toHaveBeenCalledWith(mockCreateOAuthDto);
      // Verify original repository's findOne is still used (current implementation)
      expect(mockOAuthRepository.findOne).toHaveBeenCalledWith({
        where: {
          providerId: mockCreateOAuthDto.providerId,
          provider: mockCreateOAuthDto.provider,
        },
      });
    });

    it('should handle error in transaction manager save', async () => {
      const mockTransactionRepo = {
        save: jest.fn(),
        findOne: jest.fn(),
      } as any;

      const mockManager = {
        getRepository: jest.fn().mockReturnValue(mockTransactionRepo),
      } as any;

      mockTransactionRepo.findOne.mockResolvedValue(null);
      mockTransactionRepo.save.mockRejectedValue(
        new Error('Transaction save failed'),
      );

      await expect(
        service.create(mockCreateOAuthDto, mockManager),
      ).rejects.toThrow();
    });
  });

  describe('findAllOAuthWithUser', () => {
    it('should return all OAuth connections for a user', async () => {
      const mockOAuthList = [mockOAuth];
      mockOAuthRepository.find.mockResolvedValue(mockOAuthList);

      const result = await service.findAllOAuthWithUser(1, mockI18n);

      expect(result).toEqual(mockOAuthList);
      expect(mockOAuthRepository.find).toHaveBeenCalledWith({
        where: { user: { id: 1 } },
        select: ['id', 'provider', 'providerId', 'avatar', 'user'],
      });
    });

    it('should return empty array when user has no OAuth connections', async () => {
      mockOAuthRepository.find.mockResolvedValue([]);

      const result = await service.findAllOAuthWithUser(1, mockI18n);

      expect(result).toEqual([]);
    });

    it('should handle error when find fails', async () => {
      mockOAuthRepository.find.mockRejectedValue(new Error('Find failed'));

      await expect(service.findAllOAuthWithUser(1, mockI18n)).rejects.toThrow();
    });
  });

  describe('getUserWithProviderAndProviderId', () => {
    it('should return user when OAuth connection exists', async () => {
      mockOAuthRepository.findOneBy.mockResolvedValue(mockOAuth);

      const result = await service.getUserWithProviderAndProviderId(
        'google-123',
        OAuthProviderEnum.GOOGLE,
      );

      expect(result).toEqual(mockUser);
      expect(mockOAuthRepository.findOneBy).toHaveBeenCalledWith({
        providerId: 'google-123',
        provider: OAuthProviderEnum.GOOGLE,
      });
    });

    it('should return null when OAuth connection does not exist', async () => {
      mockOAuthRepository.findOneBy.mockResolvedValue(null);

      const result = await service.getUserWithProviderAndProviderId(
        'google-123',
        OAuthProviderEnum.GOOGLE,
      );

      expect(result).toBeNull();
    });

    it('should handle error when findOneBy fails', async () => {
      mockOAuthRepository.findOneBy.mockRejectedValue(new Error('Find failed'));

      await expect(
        service.getUserWithProviderAndProviderId(
          'google-123',
          OAuthProviderEnum.GOOGLE,
        ),
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete OAuth connection successfully', async () => {
      mockOAuthRepository.findOne.mockResolvedValue(mockOAuth);
      mockOAuthRepository.delete.mockResolvedValue({
        affected: 1,
        raw: {},
      } as any);

      await service.delete(1, OAuthProviderEnum.GOOGLE, mockI18n);

      expect(mockOAuthRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: 1 }, provider: OAuthProviderEnum.GOOGLE },
      });
      expect(mockOAuthRepository.delete).toHaveBeenCalledWith({
        user: { id: 1 },
        provider: OAuthProviderEnum.GOOGLE,
      });
    });

    it('should throw error when OAuth connection not found', async () => {
      mockOAuthRepository.findOne.mockResolvedValue(null);

      await expect(
        service.delete(1, OAuthProviderEnum.GOOGLE, mockI18n),
      ).rejects.toThrow();
    });

    it('should handle error when findOne fails', async () => {
      mockOAuthRepository.findOne.mockRejectedValue(new Error('Find failed'));

      await expect(
        service.delete(1, OAuthProviderEnum.GOOGLE, mockI18n),
      ).rejects.toThrow();
    });

    it('should handle error when delete fails', async () => {
      mockOAuthRepository.findOne.mockResolvedValue(mockOAuth);
      mockOAuthRepository.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(
        service.delete(1, OAuthProviderEnum.GOOGLE, mockI18n),
      ).rejects.toThrow();
    });
  });

  describe('findProviderWithUserId', () => {
    it('should return all OAuth providers for a user', async () => {
      const mockProviders = [mockOAuth];
      mockOAuthRepository.find.mockResolvedValue(mockProviders);

      const result = await service.findProviderWithUserId(1, mockI18n);

      expect(result).toEqual(mockProviders);
      expect(mockOAuthRepository.find).toHaveBeenCalledWith({
        where: { user: { id: 1 } },
      });
    });

    it('should return empty array when user has no OAuth providers', async () => {
      mockOAuthRepository.find.mockResolvedValue([]);

      const result = await service.findProviderWithUserId(1, mockI18n);

      expect(result).toEqual([]);
    });

    it('should handle error when find fails', async () => {
      mockOAuthRepository.find.mockRejectedValue(new Error('Find failed'));

      await expect(
        service.findProviderWithUserId(1, mockI18n),
      ).rejects.toThrow();
    });
  });
});
