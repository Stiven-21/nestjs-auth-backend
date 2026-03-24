import { Test, TestingModule } from '@nestjs/testing';
import { SecurityService } from './security.service';
import { UserSecurity } from 'src/modules/users/entities/user-security.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { CreateSecurityDto } from 'src/modules/users/dto/create-security.dto';
import { I18nContext } from 'nestjs-i18n';
import { Repository } from 'typeorm';

describe('SecurityService', () => {
  let service: SecurityService;
  let mockSecurityRepository: jest.Mocked<Repository<UserSecurity>>;
  let mockI18n: I18nContext;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
  } as User;

  const mockSecurity = {
    id: 1,
    user: mockUser,
    twoFactorEnabled: false,
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

  const mockCreateSecurityDto: CreateSecurityDto = {
    user: mockUser,
  };

  beforeEach(async () => {
    mockSecurityRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      update: jest.fn(),
    } as any;

    mockI18n = {
      lang: 'en',
      t: jest.fn().mockReturnValue('translated text'),
    } as unknown as I18nContext;

    // Mock I18nContext.current() for methods that use it
    jest.spyOn(I18nContext, 'current').mockReturnValue(mockI18n as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityService,
        {
          provide: 'UserSecurityRepository',
          useValue: mockSecurityRepository,
        },
      ],
    }).compile();

    service = module.get<SecurityService>(SecurityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create security record successfully', async () => {
      mockSecurityRepository.findOne.mockResolvedValue(null);
      mockSecurityRepository.save.mockResolvedValue(mockSecurity);

      const result = await service.create(mockCreateSecurityDto, mockI18n);

      expect(result).toEqual(mockSecurity);
      expect(mockSecurityRepository.save).toHaveBeenCalledWith(
        mockCreateSecurityDto,
      );
    });

    it('should return undefined if security record already exists', async () => {
      mockSecurityRepository.findOne.mockResolvedValue(mockSecurity);

      const result = await service.create(mockCreateSecurityDto, mockI18n);

      expect(result).toBeUndefined();
      expect(mockSecurityRepository.save).not.toHaveBeenCalled();
    });

    it('should handle error when findOne fails', async () => {
      mockSecurityRepository.findOne.mockRejectedValue(
        new Error('Find failed'),
      );

      await expect(
        service.create(mockCreateSecurityDto, mockI18n),
      ).rejects.toThrow();
    });

    it('should handle error when save fails', async () => {
      mockSecurityRepository.findOne.mockResolvedValue(null);
      mockSecurityRepository.save.mockRejectedValue(new Error('Save failed'));

      await expect(
        service.create(mockCreateSecurityDto, mockI18n),
      ).rejects.toThrow();
    });

    it('should use custom i18n when provided', async () => {
      const customI18n = { lang: 'es', t: jest.fn() } as any;
      mockSecurityRepository.findOne.mockResolvedValue(null);
      mockSecurityRepository.save.mockResolvedValue(mockSecurity);

      await service.create(mockCreateSecurityDto, customI18n);

      expect(mockSecurityRepository.save).toHaveBeenCalledWith(
        mockCreateSecurityDto,
      );
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
      mockTransactionRepo.save.mockResolvedValue(mockSecurity);

      await service.create(mockCreateSecurityDto, mockI18n, mockManager);

      expect(mockManager.getRepository).toHaveBeenCalledWith(UserSecurity);
      expect(mockTransactionRepo.save).toHaveBeenCalledWith(
        mockCreateSecurityDto,
      );
    });
  });

  describe('findOneByUser', () => {
    it('should return existing security record', async () => {
      mockSecurityRepository.findOneBy.mockResolvedValue(mockSecurity);

      const result = await service.findOneByUser(mockUser, mockI18n);

      expect(result).toEqual(mockSecurity);
      expect(mockSecurityRepository.findOneBy).toHaveBeenCalledWith({
        user: { id: mockUser.id },
      });
    });

    it('should create new security record if none exists', async () => {
      mockSecurityRepository.findOneBy.mockResolvedValue(null);
      mockSecurityRepository.save.mockResolvedValue(mockSecurity);

      const result = await service.findOneByUser(mockUser, mockI18n);

      expect(result).toEqual(mockSecurity);
      expect(mockSecurityRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ user: mockUser }),
      );
    });

    it('should handle error when findOneBy fails', async () => {
      mockSecurityRepository.findOneBy.mockRejectedValue(
        new Error('Find failed'),
      );

      await expect(service.findOneByUser(mockUser, mockI18n)).rejects.toThrow();
    });

    it('should handle error when create fails', async () => {
      mockSecurityRepository.findOneBy.mockResolvedValue(null);
      mockSecurityRepository.save.mockRejectedValue(new Error('Create failed'));

      await expect(service.findOneByUser(mockUser, mockI18n)).rejects.toThrow();
    });

    it('should call create with correct DTO when record not found', async () => {
      mockSecurityRepository.findOneBy.mockResolvedValue(null);
      mockSecurityRepository.save.mockResolvedValue(mockSecurity);

      await service.findOneByUser(mockUser, mockI18n);

      expect(mockSecurityRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser,
        }),
      );
    });
  });

  describe('save', () => {
    it('should save security record successfully', async () => {
      mockSecurityRepository.save.mockResolvedValue(mockSecurity);

      const result = await service.save(mockSecurity, mockI18n);

      expect(result).toEqual(mockSecurity);
      expect(mockSecurityRepository.save).toHaveBeenCalledWith(mockSecurity);
    });

    it('should handle error when save fails', async () => {
      mockSecurityRepository.save.mockRejectedValue(new Error('Save failed'));

      await expect(service.save(mockSecurity, mockI18n)).rejects.toThrow();
    });

    it('should return saved entity', async () => {
      const savedEntity = { ...mockSecurity, updatedAt: new Date() };
      mockSecurityRepository.save.mockResolvedValue(savedEntity);

      const result = await service.save(mockSecurity, mockI18n);

      expect(result).toBe(savedEntity);
    });
  });
});
