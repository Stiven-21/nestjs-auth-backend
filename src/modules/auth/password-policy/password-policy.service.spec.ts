import { Test, TestingModule } from '@nestjs/testing';
import { PasswordPolicyService } from './password-policy.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthPasswordPolicy } from '../entities/auth-password-policy.entity';
import { Logger } from '@nestjs/common';

// Mock I18nContext before service import
jest.mock('nestjs-i18n', () => ({
  I18nContext: {
    current: jest.fn(() => ({ lang: 'en' })),
  },
}));

// Mock exceptions before service import
jest.mock('src/common/exceptions', () => ({
  ...jest.requireActual('src/common/exceptions'),
  internalServerError: jest.fn(() => {}),
}));
import * as commonExceptions from 'src/common/exceptions';

describe('PasswordPolicyService', () => {
  let service: PasswordPolicyService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordPolicyService,
        {
          provide: getRepositoryToken(AuthPasswordPolicy),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PasswordPolicyService>(PasswordPolicyService);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return the active password policy', async () => {
      const mockPolicy = { id: 1, isActive: true, minLength: 8 };
      mockRepository.findOne.mockResolvedValue(mockPolicy as any);

      const result = await service.findOne();

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { isActive: true },
      });
      expect(result).toEqual(mockPolicy);
    });

    it('should return undefined if no active policy', async () => {
      mockRepository.findOne.mockResolvedValue(undefined);

      const result = await service.findOne();

      expect(result).toBeUndefined();
    });

    it('should log error and call internalServerError on repository error', async () => {
      const error = new Error('Database error');
      mockRepository.findOne.mockRejectedValue(error);

      // The service catches error and calls internalServerError, then returns undefined
      const result = await service.findOne();

      expect(result).toBeUndefined();
      expect(Logger.prototype.error).toHaveBeenCalledWith(error);
      expect(commonExceptions.internalServerError).toHaveBeenCalledWith(
        expect.objectContaining({ lang: 'en' }),
      );
    });
  });
});
