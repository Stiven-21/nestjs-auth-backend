import { Test, TestingModule } from '@nestjs/testing';
import { DynamicQueryService } from './dynamic.service';
import { Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { ResponseFactory } from 'src/common/exceptions/response.factory';
import { Logger } from '@nestjs/common';

// Mock exceptions before service import
jest.mock('src/common/exceptions', () => ({
  ...jest.requireActual('src/common/exceptions'),
  internalServerError: jest.fn(() => {}),
}));
import * as commonExceptions from 'src/common/exceptions';

describe('DynamicQueryService', () => {
  let service: DynamicQueryService;
  let mockRepository: any;

  const mockI18n = {
    lang: 'en',
  } as unknown as I18nContext;

  const mockMetadata = {
    columns: [
      { propertyName: 'id' },
      { propertyName: 'name' },
      { propertyName: 'email' },
    ],
    relations: [{ propertyName: 'role' }, { propertyName: 'profile' }],
  };

  beforeEach(async () => {
    mockRepository = {
      metadata: mockMetadata,
      findAndCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DynamicQueryService,
        {
          provide: Repository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<DynamicQueryService>(DynamicQueryService);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(ResponseFactory, 'error').mockImplementation(() => {
      throw new Error('ResponseFactory.error');
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockRestore();
    jest.spyOn(ResponseFactory, 'error').mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isPathSafe', () => {
    it('should return true for safe paths', () => {
      // Call directly on service to preserve this
      expect((service as any).isPathSafe(['name'])).toBe(true);
      expect((service as any).isPathSafe(['role', 'name'])).toBe(true);
    });

    it('should return false for forbidden paths', () => {
      expect((service as any).isPathSafe(['__proto__'])).toBe(false);
      expect((service as any).isPathSafe(['constructor'])).toBe(false);
      expect((service as any).isPathSafe(['prototype'])).toBe(false);
    });
  });

  describe('buildNestedWhere', () => {
    it('should build nested where with ILike for string fields', () => {
      const target: any = {};
      (service as any).buildNestedWhere(['name'], 'john', target);
      // ILike returns a FindOperator
      expect(target.name).toBeInstanceOf(Object);
      expect(target.name._type).toBe('ilike');
      expect(target.name._value).toBe('%john%');
    });

    it('should convert to number for id fields', () => {
      const target: any = {};
      (service as any).buildNestedWhere(['id'], '123', target);
      expect(target).toEqual({ id: 123 });
    });

    it('should build deeply nested where', () => {
      const target: any = {};
      (service as any).buildNestedWhere(['role', 'name'], 'admin', target);
      expect(target).toEqual({
        role: {
          name: expect.objectContaining({ _type: 'ilike', _value: '%admin%' }),
        },
      });
    });
  });

  describe('buildNestedOrder', () => {
    it('should build nested order with direction', () => {
      const target: any = {};
      (service as any).buildNestedOrder(['name'], 'DESC', target);
      expect(target).toEqual({ name: 'DESC' });
    });

    it('should default to ASC for invalid direction', () => {
      const target: any = {};
      (service as any).buildNestedOrder(['name'], 'invalid', target);
      expect(target).toEqual({ name: 'ASC' });
    });

    it('should build deeply nested order', () => {
      const target: any = {};
      (service as any).buildNestedOrder(['role', 'name'], 'DESC', target);
      expect(target).toEqual({ role: { name: 'DESC' } });
    });
  });

  describe('validateInteger', () => {
    it('should throw error via ResponseFactory if value is not integer', () => {
      const validateInteger = (service as any).validateInteger;
      expect(() => validateInteger(1.5, 1, 'key', mockI18n)).toThrow();
      expect(ResponseFactory.error).toHaveBeenCalledWith({
        i18n: mockI18n,
        lang: 'en',
        code: 'BAD_REQUEST',
      });
    });

    it('should throw error if value is less than min', () => {
      const validateInteger = (service as any).validateInteger;
      expect(() => validateInteger(0, 1, 'key', mockI18n)).toThrow();
    });

    it('should not throw for valid integer', () => {
      const validateInteger = (service as any).validateInteger;
      expect(() => validateInteger(5, 1, 'key', mockI18n)).not.toThrow();
    });
  });

  describe('extractRelationsFromPaths', () => {
    it('should extract root relations from paths', () => {
      const extractRelationsFromPaths = (service as any)
        .extractRelationsFromPaths;
      const validRelations = new Set(['role', 'profile']);
      const paths = ['role.name', 'profile.bio', 'email'];
      const relations = extractRelationsFromPaths(paths, validRelations);
      expect(relations).toEqual(new Set(['role', 'profile']));
    });
  });

  describe('findAndCount', () => {
    it('should execute query with correct parameters', async () => {
      const mockData = [{ id: 1, name: 'Test' }];
      mockRepository.findAndCount.mockResolvedValue([mockData, 1]);

      const result = await service.findAndCount(
        mockRepository,
        { name: 'test' },
        1,
        10,
        mockI18n,
        undefined,
        undefined,
      );

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Array),
          order: expect.any(Object),
          relations: expect.any(Object),
          skip: 0,
          take: 10,
          select: undefined,
        }),
      );
      expect(result).toEqual({ data: mockData, total: 1 });
    });

    it('should validate page and limit', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      // page < 1 should throw via ResponseFactory.error
      await expect(
        service.findAndCount(mockRepository, {}, 0, 10, mockI18n),
      ).rejects.toThrow();
      // limit < 10 should throw
      await expect(
        service.findAndCount(mockRepository, {}, 1, 5, mockI18n),
      ).rejects.toThrow();
    });

    it('should build where conditions with ILike', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAndCount(
        mockRepository,
        { name: 'john', email: 'test@example.com' },
        1,
        10,
        mockI18n,
      );

      const callArgs = mockRepository.findAndCount.mock.calls[0][0];
      // The where should contain conditions with FindOperator
      expect(callArgs.where[0]).toEqual({
        name: expect.objectContaining({ _type: 'ilike', _value: '%john%' }),
      });
      expect(callArgs.where[1]).toEqual({
        email: expect.objectContaining({
          _type: 'ilike',
          _value: '%test@example.com%',
        }),
      });
    });

    it('should handle nested relation filters', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAndCount(
        mockRepository,
        { 'role.name': 'admin' },
        1,
        10,
        mockI18n,
      );

      const callArgs = mockRepository.findAndCount.mock.calls[0][0];
      expect(callArgs.where[0]).toEqual({
        role: {
          name: expect.objectContaining({ _type: 'ilike', _value: '%admin%' }),
        },
      });
    });

    it('should build order correctly', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAndCount(
        mockRepository,
        {},
        1,
        10,
        mockI18n,
        'name DESC, role.name ASC',
      );

      const callArgs = mockRepository.findAndCount.mock.calls[0][0];
      expect(callArgs.order).toEqual({
        name: 'DESC',
        role: { name: 'ASC' },
      });
    });

    it('should include all relations when select is not provided', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAndCount(
        mockRepository,
        {},
        1,
        10,
        mockI18n,
        undefined,
        undefined,
      );

      const callArgs = mockRepository.findAndCount.mock.calls[0][0];
      expect(callArgs.relations).toEqual({
        role: true,
        profile: true,
      });
    });

    it('should compute relations from select, filters, and sort', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAndCount(
        mockRepository,
        { 'role.name': 'admin' },
        1,
        10,
        mockI18n,
        'profile.bio DESC',
        ['role.name', 'profile.bio'] as any,
      );

      const callArgs = mockRepository.findAndCount.mock.calls[0][0];
      // Relations should include role and profile because they appear in select, filter, and sort
      expect(callArgs.relations).toEqual({
        role: true,
        profile: true,
      });
    });

    it('should handle repository error and call internalServerError', async () => {
      mockRepository.findAndCount.mockRejectedValue(new Error('DB error'));

      const result = await service.findAndCount(
        mockRepository,
        {},
        1,
        10,
        mockI18n,
      );

      // The service catches error, logs, calls internalServerError, and returns undefined
      expect(result).toBeUndefined();
      expect(Logger.prototype.error).toHaveBeenCalledWith(expect.any(Error));
      expect(commonExceptions.internalServerError).toHaveBeenCalledWith({
        i18n: mockI18n,
        lang: 'en',
      });
    });

    it('should skip and take correctly', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAndCount(mockRepository, {}, 2, 20, mockI18n);

      const callArgs = mockRepository.findAndCount.mock.calls[0][0];
      expect(callArgs.skip).toBe(20); // (2-1)*20 = 20
      expect(callArgs.take).toBe(20);
    });
  });
});
