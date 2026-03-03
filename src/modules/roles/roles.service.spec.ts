import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RolesService } from 'src/modules/roles/roles.service';
import { Role } from 'src/modules/roles/entities/role.entity';
import { Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';

describe('RolesService', () => {
  let service: RolesService;
  let repository: Repository<Role>;

  // Mock del repositorio de TypeORM
  const mockRolesRepository = {
    findAndCount: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
  };

  // Mock del contexto de I18n
  const mockI18n = {
    t: jest.fn().mockReturnValue('translated text'),
    lang: 'es',
  } as unknown as I18nContext;

  beforeEach(async () => {
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
    repository = module.get<Repository<Role>>(getRepositoryToken(Role));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of roles and total count', async () => {
      const roles = [{ id: 1, name: 'admin' }] as Role[];
      const total = 1;
      mockRolesRepository.findAndCount.mockResolvedValue([roles, total]);

      const result = await service.findAll(mockI18n);

      expect(result).toEqual({
        success: true,
        data: roles,
        meta: { total },
        error: null,
      });
      expect(repository.findAndCount).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a role if found', async () => {
      const role = { id: 1, name: 'admin' } as Role;
      mockRolesRepository.findOneBy.mockResolvedValue(role);

      const result = await service.findOne(1, mockI18n);

      expect(result).toEqual({
        success: true,
        data: role,
        meta: { total: 1 },
        error: null,
      });
    });

    it('should throw an error if role not found', async () => {
      mockRolesRepository.findOneBy.mockResolvedValue(null);

      // El servicio usa ResponseFactory.error que lanza una excepción
      await expect(service.findOne(1, mockI18n)).rejects.toThrow();
    });
  });

  describe('getNameRoleOrCreate', () => {
    it('should return existing role if found', async () => {
      const role = { id: 1, name: 'user' } as Role;
      mockRolesRepository.findOneBy.mockResolvedValue(role);

      const result = await service.getNameRoleOrCreate('user', mockI18n);

      expect(result).toEqual(role);
      expect(mockRolesRepository.save).not.toHaveBeenCalled();
    });

    it('should create and return new role if not found', async () => {
      mockRolesRepository.findOneBy.mockResolvedValue(null);
      const newRole = { id: 2, name: 'new-role', permissions: [] } as Role;
      mockRolesRepository.save.mockResolvedValue(newRole);

      // Seteamos variable de entorno necesaria para el test
      process.env.ROL_PERMISSION_DEFAULT = 'read,write';

      const result = await service.getNameRoleOrCreate('new-role', mockI18n);

      expect(result).toEqual(newRole);
      expect(mockRolesRepository.save).toHaveBeenCalled();
    });
  });
});
