import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { Role } from 'src/modules/roles/entities/role.entity';
import { internalServerError, okResponse } from 'src/common/exceptions';
import { ResponseFactory } from 'src/common/exceptions/response.factory';
import { normalizePermissions } from 'src/common/utils/normalize-permissions.utils';

// Mock normalizePermissions
jest.mock('src/common/utils/normalize-permissions.utils', () => ({
  normalizePermissions: jest.fn().mockResolvedValue(['perm1', 'perm2']),
}));

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

describe('RolesService', () => {
  let service: RolesService;
  let mockRolesRepository: jest.Mocked<Repository<Role>>;

  const mockI18n = {
    lang: 'en',
  } as unknown as I18nContext;

  beforeEach(async () => {
    mockRolesRepository = {
      findAndCount: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(Role),
          useValue: mockRolesRepository,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all roles with count', async () => {
      const roles = [
        { id: 1, name: 'Admin' },
        { id: 2, name: 'User' },
      ];
      mockRolesRepository.findAndCount.mockResolvedValue([roles, 2] as any);

      const result = await service.findAll(mockI18n);

      expect(mockRolesRepository.findAndCount).toHaveBeenCalled();
      expect(okResponse).toHaveBeenCalledWith({
        data: roles,
        meta: { total: 2 },
      });
      expect(result).toEqual({
        data: roles,
        meta: { total: 2 },
      });
    });

    it('should handle findAndCount error', async () => {
      mockRolesRepository.findAndCount.mockRejectedValue(new Error('DB error'));

      const result = await service.findAll(mockI18n);

      expect(internalServerError).toHaveBeenCalledWith({
        i18n: mockI18n,
        lang: 'en',
      });
      expect(result).toBeUndefined();
    });
  });

  describe('findOne', () => {
    it('should return a role by id', async () => {
      const role = { id: 1, name: 'Admin', permissions: ['user:read'] };
      mockRolesRepository.findOneBy.mockResolvedValue(role as any);

      const result = await service.findOne(1, mockI18n);

      expect(mockRolesRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(okResponse).toHaveBeenCalledWith({
        data: role,
        meta: { total: 1 },
      });
      expect(result).toEqual({
        data: role,
        meta: { total: 1 },
      });
    });

    it('should throw ROL_NOT_FOUND if role does not exist', async () => {
      mockRolesRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(999, mockI18n)).rejects.toThrow(
        'ResponseFactory.error called',
      );

      expect(ResponseFactory.error).toHaveBeenCalledWith({
        i18n: mockI18n,
        lang: 'en',
        code: 'ROL_NOT_FOUND',
      });
    });

    it('should handle findOneBy error', async () => {
      mockRolesRepository.findOneBy.mockRejectedValue(new Error('DB error'));

      await expect(service.findOne(1, mockI18n)).rejects.toThrow();

      expect(internalServerError).toHaveBeenCalledWith({
        i18n: mockI18n,
        lang: 'en',
      });
    });
  });

  describe('getNameRoleOrCreate', () => {
    it('should return existing role if found', async () => {
      const role = { id: 1, name: 'Admin', permissions: ['perm1'] };
      mockRolesRepository.findOneBy.mockResolvedValue(role as any);

      const result = await service.getNameRoleOrCreate('Admin', mockI18n);

      expect(mockRolesRepository.findOneBy).toHaveBeenCalledWith({
        name: 'Admin',
      });
      expect(mockRolesRepository.save).not.toHaveBeenCalled();
      expect(result).toEqual(role);
    });

    it('should create new role if not exists with default permissions', async () => {
      mockRolesRepository.findOneBy.mockResolvedValue(null);
      mockRolesRepository.save.mockResolvedValue({
        id: 1,
        name: 'NewRole',
        permissions: ['perm1', 'perm2'],
      } as any);

      const result = await service.getNameRoleOrCreate('NewRole', mockI18n);

      expect(mockRolesRepository.findOneBy).toHaveBeenCalledWith({
        name: 'NewRole',
      });
      expect(normalizePermissions).toHaveBeenCalledWith(
        process.env.ROL_PERMISSION_DEFAULT,
      );
      expect(mockRolesRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'NewRole',
          permissions: ['perm1', 'perm2'],
        }),
      );
      expect(result).toBeDefined();
    });

    it('should handle findOneBy error', async () => {
      mockRolesRepository.findOneBy.mockRejectedValue(new Error('DB error'));

      const result = await service.getNameRoleOrCreate('Admin', mockI18n);

      expect(internalServerError).toHaveBeenCalledWith({
        i18n: mockI18n,
        lang: 'en',
      });
      expect(result).toBeUndefined();
    });

    it('should handle save error when creating role', async () => {
      mockRolesRepository.findOneBy.mockResolvedValue(null);
      mockRolesRepository.save.mockRejectedValue(new Error('DB error'));

      const result = await service.getNameRoleOrCreate('NewRole', mockI18n);

      expect(internalServerError).toHaveBeenCalledWith({
        i18n: mockI18n,
        lang: 'en',
      });
      expect(result).toBeNull();
    });
  });
});
