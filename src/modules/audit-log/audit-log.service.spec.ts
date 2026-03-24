import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService } from './audit-log.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { AuditLog } from 'src/modules/audit-log/entities/audit-log.entity';
import { CreateAuditLogDto } from 'src/modules/audit-log/dto/create-audit-log.dto';
import { internalServerError, okResponse } from 'src/common/exceptions';

// Mock internalServerError and okResponse
jest.mock('src/common/exceptions', () => ({
  ...jest.requireActual('src/common/exceptions'),
  internalServerError: jest.fn(() => {}),
  okResponse: jest.fn((args) => args),
}));

describe('AuditLogService', () => {
  let service: AuditLogService;
  let mockAuditLogRepository: jest.Mocked<Repository<AuditLog>>;

  const mockI18n = {
    lang: 'en',
  } as unknown as I18nContext;

  const createAuditLogDto: CreateAuditLogDto = {
    event: 'LOGIN_SUCCESS' as any,
    actorId: 1,
    targetId: 1,
    metadata: { ip: '127.0.0.1' },
    ip: '127.0.0.1',
    userAgent: 'Test Agent',
  };

  beforeEach(async () => {
    mockAuditLogRepository = {
      save: jest.fn(),
      findAndCount: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditLogRepository,
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an audit log successfully', async () => {
      mockAuditLogRepository.save.mockResolvedValue({
        id: 1,
        ...createAuditLogDto,
      } as any);

      await service.create(createAuditLogDto, mockI18n);

      expect(mockAuditLogRepository.save).toHaveBeenCalledWith(
        createAuditLogDto,
      );
    });

    it('should handle save error', async () => {
      mockAuditLogRepository.save.mockRejectedValue(new Error('DB error'));

      await service.create(createAuditLogDto, mockI18n);

      expect(internalServerError).toHaveBeenCalledWith({
        i18n: mockI18n,
        lang: 'en',
      });
    });
  });

  describe('findOne', () => {
    it('should find audit logs by userId with count', async () => {
      const auditLogs = [
        { id: 1, actorId: 1, event: 'LOGIN_SUCCESS' },
        { id: 2, actorId: 1, event: 'LOGOUT' },
      ];
      mockAuditLogRepository.findAndCount.mockResolvedValue([
        auditLogs,
        2,
      ] as any);

      const result = await service.findOne(1, mockI18n);

      expect(mockAuditLogRepository.findAndCount).toHaveBeenCalledWith({
        where: { actorId: 1 },
      });
      expect(okResponse).toHaveBeenCalledWith({
        data: auditLogs,
        meta: { total: 2 },
      });
      expect(result).toEqual({
        data: auditLogs,
        meta: { total: 2 },
      });
    });

    it('should return empty data when no logs found', async () => {
      mockAuditLogRepository.findAndCount.mockResolvedValue([[], 0] as any);

      const result = await service.findOne(1, mockI18n);

      expect(result).toEqual({ data: [], meta: { total: 0 } });
    });

    it('should handle findAndCount error', async () => {
      mockAuditLogRepository.findAndCount.mockRejectedValue(
        new Error('DB error'),
      );

      const result = await service.findOne(1, mockI18n);

      expect(internalServerError).toHaveBeenCalledWith({
        i18n: mockI18n,
        lang: 'en',
      });
      expect(result).toBeUndefined();
    });
  });
});
