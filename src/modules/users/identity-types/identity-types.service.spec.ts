import { Test, TestingModule } from '@nestjs/testing';
import { IdentityTypesService } from './identity-types.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { IdentityType } from 'src/modules/users/entities/identity-type.entity';
import { internalServerError, okResponse } from 'src/common/exceptions';
import { ResponseFactory } from 'src/common/exceptions/response.factory';

// Mock ResponseFactory
jest.mock('src/common/exceptions/response.factory', () => ({
  ResponseFactory: {
    error: jest.fn(() => {
      throw new Error('ResponseFactory.error called');
    }),
  },
}));

// Mock internalServerError and okResponse
jest.mock('src/common/exceptions', () => ({
  ...jest.requireActual('src/common/exceptions'),
  internalServerError: jest.fn(() => {}),
  okResponse: jest.fn((args) => args),
}));

describe('IdentityTypesService', () => {
  let service: IdentityTypesService;
  let mockIdentityTypesRepository: jest.Mocked<Repository<IdentityType>>;

  const mockI18n = {
    lang: 'en',
  } as unknown as I18nContext;

  beforeEach(async () => {
    mockIdentityTypesRepository = {
      findAndCount: jest.fn(),
      findOneBy: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentityTypesService,
        {
          provide: getRepositoryToken(IdentityType),
          useValue: mockIdentityTypesRepository,
        },
      ],
    }).compile();

    service = module.get<IdentityTypesService>(IdentityTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all identity types with count', async () => {
      const identityTypes = [
        { id: 1, name: 'Passport' },
        { id: 2, name: 'Driver License' },
      ];
      mockIdentityTypesRepository.findAndCount.mockResolvedValue([
        identityTypes,
        2,
      ] as any);

      const result = await service.findAll(mockI18n);

      expect(mockIdentityTypesRepository.findAndCount).toHaveBeenCalled();
      expect(okResponse).toHaveBeenCalledWith({
        data: identityTypes,
        meta: { total: 2 },
      });
      expect(result).toEqual({
        data: identityTypes,
        meta: { total: 2 },
      });
    });

    it('should handle findAndCount error', async () => {
      mockIdentityTypesRepository.findAndCount.mockRejectedValue(
        new Error('DB error'),
      );

      const result = await service.findAll(mockI18n);

      expect(internalServerError).toHaveBeenCalledWith({
        i18n: mockI18n,
        lang: 'en',
      });
      expect(result).toBeUndefined();
    });
  });

  describe('findOne', () => {
    it('should return an identity type by id', async () => {
      const identityType = { id: 1, name: 'Passport' };
      mockIdentityTypesRepository.findOneBy.mockResolvedValue(
        identityType as any,
      );

      const result = await service.findOne(1, mockI18n);

      expect(mockIdentityTypesRepository.findOneBy).toHaveBeenCalledWith({
        id: 1,
      });
      expect(okResponse).toHaveBeenCalledWith({
        data: identityType,
        meta: { total: 1 },
      });
      expect(result).toEqual({
        data: identityType,
        meta: { total: 1 },
      });
    });

    it('should throw IDENTITY_TYPE_NOT_FOUND if identity type does not exist', async () => {
      mockIdentityTypesRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(999, mockI18n)).rejects.toThrow(
        'ResponseFactory.error called',
      );

      expect(ResponseFactory.error).toHaveBeenCalledWith({
        i18n: mockI18n,
        lang: 'en',
        code: 'IDENTITY_TYPE_NOT_FOUND',
      });
    });

    it('should handle findOneBy error', async () => {
      mockIdentityTypesRepository.findOneBy.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(service.findOne(1, mockI18n)).rejects.toThrow();

      expect(internalServerError).toHaveBeenCalledWith({
        i18n: mockI18n,
        lang: 'en',
      });
    });
  });
});
