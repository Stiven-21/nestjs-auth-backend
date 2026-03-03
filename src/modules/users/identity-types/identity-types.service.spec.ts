import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IdentityTypesService } from 'src/modules/users/identity-types/identity-types.service';
import { IdentityType } from 'src/modules/users/entities/identity-type.entity';
import { Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';

describe('IdentityTypesService', () => {
  let service: IdentityTypesService;
  let repository: Repository<IdentityType>;

  const mockIdentityTypesRepository = {
    findAndCount: jest.fn(),
    findOneBy: jest.fn(),
  };

  const mockI18n = {
    t: jest.fn().mockReturnValue('translated text'),
    lang: 'es',
  } as unknown as I18nContext;

  beforeEach(async () => {
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
    repository = module.get<Repository<IdentityType>>(
      getRepositoryToken(IdentityType),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all identity types', async () => {
      const identityTypes = [{ id: 1, name: 'Cédula' }] as IdentityType[];
      const total = 1;
      mockIdentityTypesRepository.findAndCount.mockResolvedValue([
        identityTypes,
        total,
      ]);

      const result = await service.findAll(mockI18n);

      expect(result).toEqual({
        success: true,
        data: identityTypes,
        meta: { total },
        error: null,
      });
      expect(repository.findAndCount).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an identity type if found', async () => {
      const identityType = { id: 1, name: 'Cédula' } as IdentityType;
      mockIdentityTypesRepository.findOneBy.mockResolvedValue(identityType);

      const result = await service.findOne(1, mockI18n);

      expect(result).toEqual({
        success: true,
        data: identityType,
        meta: { total: 1 },
        error: null,
      });
    });

    it('should throw an error if not found', async () => {
      mockIdentityTypesRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(999, mockI18n)).rejects.toThrow();
    });
  });
});
