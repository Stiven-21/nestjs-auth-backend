import { Test, TestingModule } from '@nestjs/testing';
import { CredentialsService } from './credentials.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { UserAccountCredentials } from 'src/modules/users/entities/user-account-credentials.entity';
import { CreateCredentialsDto } from 'src/modules/users/dto/create-credentials.dto';
import { UpdatePasswordDto } from 'src/modules/users/dto/update-user.dto';
import { ResponseFactory } from 'src/common/exceptions/response.factory';
import { internalServerError } from 'src/common/exceptions';
import * as bcrypt from 'bcryptjs';

// Mock UsersService to avoid uuid ESM import issues
import { UsersService } from 'src/modules/users/users.service';

jest.mock('src/modules/users/users.service', () => ({
  UsersService: jest.fn().mockImplementation(() => ({
    __findOneByEmail: jest.fn(),
  })),
}));

// Mock bcrypt
jest.mock('bcryptjs');

// Mock ResponseFactory
jest.mock('src/common/exceptions/response.factory', () => ({
  ResponseFactory: {
    error: jest.fn(() => {
      throw new Error('ResponseFactory.error called');
    }),
  },
}));

// Mock internalServerError
jest.mock('src/common/exceptions', () => ({
  ...jest.requireActual('src/common/exceptions'),
  internalServerError: jest.fn(() => {}),
}));

// Get references to mocked functions
const mockHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
const mockCompare = bcrypt.compare as jest.MockedFunction<
  typeof bcrypt.compare
>;

describe('CredentialsService', () => {
  let service: CredentialsService;
  let mockCredentialsRepository: jest.Mocked<
    Repository<UserAccountCredentials>
  >;
  let mockUsersService: jest.Mocked<UsersService>;

  const mockI18n = {
    lang: 'en',
  } as unknown as I18nContext;

  const userEntity = { id: 1, email: 'test@example.com' } as any;

  const createCredentialsDto: CreateCredentialsDto = {
    user: userEntity,
    password: 'password123',
  };

  const updatePasswordDto: UpdatePasswordDto = {
    password: 'newpassword123',
    password_confirm: 'newpassword123',
  };

  beforeEach(async () => {
    (mockHash as any).mockResolvedValue('hashed-password');
    (mockCompare as any).mockResolvedValue(true);

    mockCredentialsRepository = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as any;

    mockUsersService = {
      __findOneByEmail: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CredentialsService,
        {
          provide: getRepositoryToken(UserAccountCredentials),
          useValue: mockCredentialsRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<CredentialsService>(CredentialsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create new credentials successfully', async () => {
      mockCredentialsRepository.findOne.mockResolvedValue(null);
      mockCredentialsRepository.save.mockResolvedValue({
        id: 1,
        user: userEntity,
        password: 'hashed-password',
      } as any);

      const result = await service.create(createCredentialsDto, mockI18n);

      expect(mockCredentialsRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: userEntity.id } },
      });
      expect(mockHash).toHaveBeenCalledWith('password123', 10);
      expect(mockCredentialsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user: userEntity,
          password: 'hashed-password',
        }),
      );
      expect(result).toBeDefined();
    });

    it('should throw error if user already has credentials', async () => {
      mockCredentialsRepository.findOne.mockResolvedValue({
        id: 1,
        user: userEntity,
      } as any);

      await expect(
        service.create(createCredentialsDto, mockI18n),
      ).rejects.toThrow('ResponseFactory.error called');

      expect(ResponseFactory.error).toHaveBeenCalledWith({
        i18n: mockI18n,
        lang: 'en',
        code: 'USER_HAS_CREDENTIALS',
      });
    });

    it('should handle save error', async () => {
      mockCredentialsRepository.findOne.mockResolvedValue(null);
      mockCredentialsRepository.save.mockRejectedValue(new Error('DB error'));

      const result = await service.create(createCredentialsDto, mockI18n);

      expect(internalServerError).toHaveBeenCalledWith({
        i18n: mockI18n,
        lang: 'en',
      });
      expect(result).toBeUndefined();
    });

    it('should use custom entity manager when provided', async () => {
      mockCredentialsRepository.findOne.mockResolvedValue(null);
      const customManager = {
        getRepository: jest.fn().mockReturnValue({
          save: jest.fn().mockResolvedValue({ id: 1 } as any),
        }),
      } as any;

      await service.create(createCredentialsDto, mockI18n, customManager);

      expect(customManager.getRepository).toHaveBeenCalledWith(
        UserAccountCredentials,
      );
    });
  });

  describe('updatePassword', () => {
    it('should update password for existing credentials', async () => {
      const existingCredential = {
        id: 1,
        user: userEntity,
        password: 'old-hash',
      } as any;

      mockCredentialsRepository.findOneBy.mockResolvedValue(existingCredential);
      mockCredentialsRepository.update.mockResolvedValue({
        affected: 1,
      } as any);

      const result = await service.updatePassword(
        userEntity.email,
        updatePasswordDto,
        mockI18n,
      );

      expect(mockHash).toHaveBeenCalledWith('newpassword123', 10);
      expect(mockCredentialsRepository.update).toHaveBeenCalledWith(1, {
        password: 'hashed-password',
      });
      expect(result).toEqual({ affected: 1 });
    });

    it('should create new credentials if none exist', async () => {
      mockCredentialsRepository.findOneBy.mockResolvedValue(null);
      mockUsersService.__findOneByEmail.mockResolvedValue(userEntity);
      mockCredentialsRepository.save.mockResolvedValue({
        id: 1,
        user: userEntity,
        password: 'hashed-password',
      } as any);
      mockCredentialsRepository.update.mockResolvedValue({
        affected: 1,
      } as any);

      const result = await service.updatePassword(
        userEntity.email,
        updatePasswordDto,
        mockI18n,
      );

      expect(mockUsersService.__findOneByEmail).toHaveBeenCalledWith(
        userEntity.email,
        mockI18n,
      );
      expect(mockCredentialsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user: userEntity,
          password: 'hashed-password',
        }),
      );
      expect(result).toBeDefined();
    });

    it('should throw error if passwords do not match', async () => {
      const mismatchedDto: UpdatePasswordDto = {
        password: 'password1',
        password_confirm: 'password2',
      };

      // Mock existing credential to avoid undefined id later
      mockCredentialsRepository.findOneBy.mockResolvedValue({
        id: 1,
        user: userEntity,
        password: 'old-hash',
      } as any);

      await expect(
        service.updatePassword(userEntity.email, mismatchedDto, mockI18n),
      ).rejects.toThrow('ResponseFactory.error called');

      expect(ResponseFactory.error).toHaveBeenCalledWith({
        i18n: mockI18n,
        lang: 'en',
        code: 'PASSWORDS_DOES_NOT_MATCH',
      });
    });

    it('should handle findOneBy error', async () => {
      mockCredentialsRepository.findOneBy.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(
        service.updatePassword(userEntity.email, updatePasswordDto, mockI18n),
      ).rejects.toThrow('DB error');
    });

    it('should handle update error', async () => {
      const existingCredential = {
        id: 1,
        user: userEntity,
        password: 'old-hash',
      } as any;

      mockCredentialsRepository.findOneBy.mockResolvedValue(existingCredential);
      mockCredentialsRepository.update.mockRejectedValue(new Error('DB error'));

      const result = await service.updatePassword(
        userEntity.email,
        updatePasswordDto,
        mockI18n,
      );

      expect(internalServerError).toHaveBeenCalledWith({
        i18n: mockI18n,
        lang: 'en',
      });
      expect(result).toBeUndefined();
    });

    it('should handle save error when creating new credentials', async () => {
      mockCredentialsRepository.findOneBy.mockResolvedValue(null);
      mockUsersService.__findOneByEmail.mockResolvedValue(userEntity);
      mockCredentialsRepository.save.mockRejectedValue(new Error('DB error'));

      const result = await service.updatePassword(
        userEntity.email,
        updatePasswordDto,
        mockI18n,
      );

      expect(internalServerError).toHaveBeenCalledWith({
        i18n: mockI18n,
        lang: 'en',
      });
      expect(result).toBeUndefined();
    });

    it('should use custom entity manager when provided', async () => {
      const existingCredential = {
        id: 1,
        user: userEntity,
        password: 'old-hash',
      } as any;
      mockCredentialsRepository.findOneBy.mockResolvedValue(existingCredential);

      const customManager = {
        getRepository: jest.fn().mockReturnValue({
          update: jest.fn().mockResolvedValue({ affected: 1 } as any),
        }),
      } as any;

      await service.updatePassword(
        userEntity.email,
        updatePasswordDto,
        mockI18n,
        customManager,
      );

      expect(customManager.getRepository).toHaveBeenCalledWith(
        UserAccountCredentials,
      );
    });
  });

  describe('validateReathPassword', () => {
    it('should return true for valid password', async () => {
      mockCredentialsRepository.findOne.mockResolvedValue({
        id: 1,
        password: 'hashed-password',
      } as any);

      const result = await service.validateReathPassword(
        userEntity.id,
        'password123',
        mockI18n,
      );

      expect(mockCompare).toHaveBeenCalledWith(
        'password123',
        'hashed-password',
      );
      expect(result).toBe(true);
    });

    it('should return false for invalid password', async () => {
      (mockCompare as any).mockResolvedValue(false);
      mockCredentialsRepository.findOne.mockResolvedValue({
        id: 1,
        password: 'hashed-password',
      } as any);

      const result = await service.validateReathPassword(
        userEntity.id,
        'wrongpassword',
        mockI18n,
      );

      expect(result).toBe(false);
    });

    it('should return true when no credentials and empty password', async () => {
      mockCredentialsRepository.findOne.mockResolvedValue(null);

      const result = await service.validateReathPassword(
        userEntity.id,
        '',
        mockI18n,
      );

      expect(result).toBe(true);
    });

    it('should return false when no credentials and non-empty password', async () => {
      mockCredentialsRepository.findOne.mockResolvedValue(null);

      const result = await service.validateReathPassword(
        userEntity.id,
        'somepassword',
        mockI18n,
      );

      expect(result).toBe(false);
    });

    it('should handle findOne error', async () => {
      mockCredentialsRepository.findOne.mockRejectedValue(
        new Error('DB error'),
      );

      const result = await service.validateReathPassword(
        userEntity.id,
        'password',
        mockI18n,
      );

      expect(internalServerError).toHaveBeenCalledWith({
        i18n: mockI18n,
        lang: 'en',
      });
      expect(result).toBe(false);
    });
  });

  describe('findCredentialsOfUser', () => {
    it('should find credentials by user ID', async () => {
      const credentials = {
        id: 1,
        user: userEntity,
        password: 'hashed-password',
      } as any;
      mockCredentialsRepository.findOne.mockResolvedValue(credentials);

      const result = await service.findCredentialsOfUser(
        userEntity.id,
        mockI18n,
      );

      expect(mockCredentialsRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: userEntity.id } },
      });
      expect(result).toEqual(credentials);
    });

    it('should return null when no credentials found', async () => {
      mockCredentialsRepository.findOne.mockResolvedValue(null);

      const result = await service.findCredentialsOfUser(
        userEntity.id,
        mockI18n,
      );

      expect(result).toBeNull();
    });

    it('should handle findOne error', async () => {
      mockCredentialsRepository.findOne.mockRejectedValue(
        new Error('DB error'),
      );

      const result = await service.findCredentialsOfUser(
        userEntity.id,
        mockI18n,
      );

      expect(internalServerError).toHaveBeenCalledWith({
        i18n: mockI18n,
        lang: 'en',
      });
      expect(result).toBeUndefined();
    });
  });
});
