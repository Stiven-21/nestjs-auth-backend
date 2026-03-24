import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { I18nContext } from 'nestjs-i18n';
import { ServiceUnavailableException } from '@nestjs/common';
import { TwoFactorType } from './common/enum/two-factor-type.enum';

describe('AppService', () => {
  let service: AppService;

  const mockDataSource = {
    query: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockI18n = {
    lang: 'en',
  } as unknown as I18nContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHealthStatus', () => {
    it('should return health status ok when database is up', async () => {
      mockDataSource.query.mockResolvedValue([{ 1: 1 }]);
      process.env.I18N_ENABLED = 'true';

      const result = await service.getHealthStatus(mockI18n);

      expect(result.data.status).toBe('ok');
      expect(result.data.checks.database).toBe('up');
    });

    it('should throw ServiceUnavailableException when database is down', async () => {
      mockDataSource.query.mockRejectedValue(new Error('DB Down'));

      await expect(service.getHealthStatus(mockI18n)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('get2faType', () => {
    it('should return all two factor types', async () => {
      const result = await service.get2faType(mockI18n);
      expect(result.data).toEqual(Object.values(TwoFactorType));
    });
  });
});
