// Mock dependencies BEFORE any imports that use them
jest.mock('nestjs-i18n', () => ({
  I18nContext: {
    current: jest.fn(() => ({ lang: 'en' })),
  },
}));

jest.mock('src/common/exceptions', () => ({
  ...jest.requireActual('src/common/exceptions'),
  internalServerError: jest.fn(() => {}),
  okResponse: jest.fn((args) => args),
}));

jest.mock('src/common/exceptions/response.factory', () => ({
  ResponseFactory: {
    error: jest.fn(() => {
      throw new Error('ResponseFactory.error');
    }),
  },
}));

jest.mock('src/common/utils/hash.utils', () => ({
  hashValue: jest.fn((val) => `hashed-${val}`),
}));

jest.mock('uuid', () => ({
  v7: jest.fn(() => 'generated-uuid'),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ReAuthService } from './re-auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthReAuthToken } from '../entities/auth-reauth-token.entity';
import { CredentialsService } from 'src/modules/users/credentials/credentials.service';
import { Logger } from '@nestjs/common';
import * as commonExceptions from 'src/common/exceptions';
import { ResponseFactory } from 'src/common/exceptions/response.factory';

describe('ReAuthService', () => {
  let service: ReAuthService;
  let mockReAuthTokenRepository: any;
  let mockCredentialsService: any;

  const mockEntityManager = {
    getRepository: jest.fn(),
  } as any;

  beforeEach(async () => {
    mockReAuthTokenRepository = {
      findOne: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    mockCredentialsService = {
      validateReathPassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReAuthService,
        {
          provide: getRepositoryToken(AuthReAuthToken),
          useValue: mockReAuthTokenRepository,
        },
        {
          provide: CredentialsService,
          useValue: mockCredentialsService,
        },
      ],
    }).compile();

    service = module.get<ReAuthService>(ReAuthService);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('reauthenticate', () => {
    it('should successfully reauthenticate and return token', async () => {
      mockCredentialsService.validateReathPassword.mockResolvedValue(true);
      mockReAuthTokenRepository.update.mockResolvedValue({
        affected: 1,
      } as any);
      mockReAuthTokenRepository.save.mockResolvedValue({} as any);

      const result = await service.reauthenticate(1, 'password', {
        lang: 'en',
      } as any);

      expect(mockCredentialsService.validateReathPassword).toHaveBeenCalledWith(
        1,
        'password',
        expect.any(Object),
      );
      expect(mockReAuthTokenRepository.update).toHaveBeenCalledWith(
        { user: { id: 1 } },
        { revoked: true },
      );
      expect(mockReAuthTokenRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'hashed-generated-uuid',
          user: { id: 1 },
        }),
      );
      expect(result).toEqual(
        commonExceptions.okResponse({
          data: 'generated-uuid',
          meta: { reAuthTokenExpiresIn: expect.any(Date) },
        }),
      );
    });

    it('should call ResponseFactory.error if password is invalid', async () => {
      mockCredentialsService.validateReathPassword.mockResolvedValue(false);

      await expect(
        service.reauthenticate(1, 'wrong', { lang: 'en' } as any),
      ).rejects.toThrow();

      expect(ResponseFactory.error).toHaveBeenCalledWith({
        i18n: expect.any(Object),
        lang: 'en',
        code: 'INVALID_PASSWORD',
      });
    });

    it('should handle error in validateReathPassword', async () => {
      const error = new Error('Validation error');
      mockCredentialsService.validateReathPassword.mockRejectedValue(error);

      await expect(
        service.reauthenticate(1, 'password', { lang: 'en' } as any),
      ).rejects.toThrow();

      expect(Logger.prototype.error).toHaveBeenCalledWith(error);
      expect(commonExceptions.internalServerError).toHaveBeenCalledWith({
        i18n: expect.any(Object),
        lang: 'en',
      });
    });

    it('should handle error in update old tokens and still return token', async () => {
      mockCredentialsService.validateReathPassword.mockResolvedValue(true);
      mockReAuthTokenRepository.update.mockRejectedValue(
        new Error('Update error'),
      );
      mockReAuthTokenRepository.save.mockResolvedValue({} as any);

      const result = await service.reauthenticate(1, 'password', {
        lang: 'en',
      } as any);

      expect(Logger.prototype.error).toHaveBeenCalledWith(expect.any(Error));
      expect(commonExceptions.internalServerError).toHaveBeenCalledWith(
        expect.objectContaining({ lang: 'en' }),
      );
      expect(result).toEqual(
        commonExceptions.okResponse({
          data: 'generated-uuid',
          meta: { reAuthTokenExpiresIn: expect.any(Date) },
        }),
      );
    });

    it('should handle error in save new token and still return token', async () => {
      mockCredentialsService.validateReathPassword.mockResolvedValue(true);
      mockReAuthTokenRepository.update.mockResolvedValue({} as any);
      mockReAuthTokenRepository.save.mockRejectedValue(new Error('Save error'));

      const result = await service.reauthenticate(1, 'password', {
        lang: 'en',
      } as any);

      expect(Logger.prototype.error).toHaveBeenCalledWith(expect.any(Error));
      expect(commonExceptions.internalServerError).toHaveBeenCalledWith(
        expect.objectContaining({ lang: 'en' }),
      );
      expect(result).toEqual(
        commonExceptions.okResponse({
          data: 'generated-uuid',
          meta: { reAuthTokenExpiresIn: expect.any(Date) },
        }),
      );
    });
  });

  describe('consumeToken', () => {
    it('should consume a valid token and revoke all old tokens', async () => {
      const token = 'plain-token';
      const hashedToken = 'hashed-plain-token';
      const mockReAuthToken = {
        id: 1,
        token: hashedToken,
        user: { id: 1 },
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        revoked: false,
      };
      const mockOldTokens = [
        { id: 2, token: 'hashed-old1', user: { id: 1 }, revoked: false },
        { id: 3, token: 'hashed-old2', user: { id: 1 }, revoked: false },
      ];

      mockReAuthTokenRepository.findOne.mockResolvedValue(
        mockReAuthToken as any,
      );
      mockReAuthTokenRepository.find.mockResolvedValue(mockOldTokens as any);
      mockReAuthTokenRepository.save.mockResolvedValue({} as any);

      await service.consumeToken(1, token, { lang: 'en' } as any);

      expect(mockReAuthTokenRepository.findOne).toHaveBeenCalledWith({
        where: {
          user: { id: 1 },
          token: hashedToken,
          revoked: false,
        },
      });
      expect(mockReAuthTokenRepository.find).toHaveBeenCalledWith({
        where: { user: { id: 1 }, revoked: false },
      });
      expect(mockReAuthTokenRepository.save).toHaveBeenCalledWith(
        mockOldTokens,
      );
    });

    it('should throw if token not found', async () => {
      mockReAuthTokenRepository.findOne.mockResolvedValue(null);

      await expect(
        service.consumeToken(1, 'token', { lang: 'en' } as any),
      ).rejects.toThrow();

      expect(ResponseFactory.error).toHaveBeenCalledWith({
        i18n: expect.any(Object),
        lang: 'en',
        code: 'INVALID_REAUTH_TOKEN',
      });
    });

    it('should throw if token is expired', async () => {
      const mockExpiredToken = {
        id: 1,
        token: 'hashed-token',
        user: { id: 1 },
        expiresAt: new Date(Date.now() - 1000),
        revoked: false,
      };
      mockReAuthTokenRepository.findOne.mockResolvedValue(
        mockExpiredToken as any,
      );

      await expect(
        service.consumeToken(1, 'token', { lang: 'en' } as any),
      ).rejects.toThrow();

      expect(ResponseFactory.error).toHaveBeenCalledWith({
        i18n: expect.any(Object),
        lang: 'en',
        code: 'INVALID_REAUTH_TOKEN',
      });
    });

    it('should throw if token is revoked', async () => {
      const mockRevokedToken = {
        id: 1,
        token: 'hashed-token',
        user: { id: 1 },
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        revoked: true,
      };
      mockReAuthTokenRepository.findOne.mockResolvedValue(
        mockRevokedToken as any,
      );

      await expect(
        service.consumeToken(1, 'token', { lang: 'en' } as any),
      ).rejects.toThrow();

      expect(ResponseFactory.error).toHaveBeenCalledWith({
        i18n: expect.any(Object),
        lang: 'en',
        code: 'INVALID_REAUTH_TOKEN',
      });
    });

    it('should throw if token hash does not match', async () => {
      const mockToken = {
        id: 1,
        token: 'hashed-different',
        user: { id: 1 },
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        revoked: false,
      };
      mockReAuthTokenRepository.findOne.mockResolvedValue(mockToken as any);

      await expect(
        service.consumeToken(1, 'token', { lang: 'en' } as any),
      ).rejects.toThrow();

      expect(ResponseFactory.error).toHaveBeenCalledWith({
        i18n: expect.any(Object),
        lang: 'en',
        code: 'INVALID_REAUTH_TOKEN',
      });
    });

    it('should handle error during findOne', async () => {
      mockReAuthTokenRepository.findOne.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(
        service.consumeToken(1, 'token', { lang: 'en' } as any),
      ).rejects.toThrow();

      expect(Logger.prototype.error).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should use custom manager if provided', async () => {
      const customRepo = {
        save: jest.fn(),
      } as any;
      mockEntityManager.getRepository.mockReturnValue(customRepo);

      const mockToken = {
        id: 1,
        token: 'hashed-token',
        user: { id: 1 },
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        revoked: false,
      };
      const mockOldTokens = [
        { id: 2, token: 'hashed-old1', user: { id: 1 }, revoked: false },
        { id: 3, token: 'hashed-old2', user: { id: 1 }, revoked: false },
      ];
      mockReAuthTokenRepository.findOne.mockResolvedValue(mockToken as any);
      mockReAuthTokenRepository.find.mockResolvedValue(mockOldTokens as any);

      await service.consumeToken(
        1,
        'token',
        { lang: 'en' } as any,
        mockEntityManager,
      );

      expect(mockEntityManager.getRepository).toHaveBeenCalledWith(
        AuthReAuthToken,
      );
      expect(customRepo.save).toHaveBeenCalledWith(mockOldTokens);
    });
  });

  describe('validate', () => {
    it('should return true if token is valid', async () => {
      mockReAuthTokenRepository.findOne.mockResolvedValue({
        id: 1,
        token: 'hashed-token',
        user: { id: 1 },
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        revoked: false,
      } as any);
      mockReAuthTokenRepository.find.mockResolvedValue([] as any);

      const result = await service.validate(1, 'token', { lang: 'en' } as any);

      expect(result).toBe(true);
    });
  });
});
