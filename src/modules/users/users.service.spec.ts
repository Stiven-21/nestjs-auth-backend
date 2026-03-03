import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from 'src/modules/users/users.service';
import { User } from 'src/modules/users/entities/user.entity';
import { DataSource } from 'typeorm';
import { IdentityTypesService } from 'src/modules/users/identity-types/identity-types.service';
import { DynamicQueryService } from 'src/common/services/query/dynamic.service';
import { RolesService } from 'src/modules/roles/roles.service';
import { OAuthService } from 'src/modules/users/oauth/oauth.service';
import { TokensService } from 'src/modules/users/tokens/tokens.service';
import { AuditLogService } from 'src/modules/audit-log/audit-log.service';
import { EmailChangeRequestService } from 'src/modules/users/email-change-request/email-change-request.service';
import { SecurityService } from 'src/modules/users/security/security.service';
import { PinoLogger } from 'nestjs-pino';
import { I18nContext } from 'nestjs-i18n';

// Mock de uuid para evitar errores de ESM en Jest
jest.mock('uuid', () => ({
  v7: jest.fn().mockReturnValue('mocked-user-secret'),
}));

describe('UsersService', () => {
  let service: UsersService;

  const mockUsersRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    }),
  };

  const mockIdentityTypesService = { findOne: jest.fn() };
  const mockDynamicQueryService = { findAndCount: jest.fn() };
  const mockRolesService = {
    getNameRoleOrCreate: jest.fn(),
    findOne: jest.fn(),
  };
  const mockOAuthService = {
    getUserWithProviderAndProviderId: jest.fn(),
    findAllOAuthWithUser: jest.fn(),
  };
  const mockTokensService = {
    findOneByToken: jest.fn(),
    updateTokenIsUsed: jest.fn(),
  };
  const mockAuditLogService = { create: jest.fn() };
  const mockEmailChangeRequestService = { create: jest.fn() };
  const mockSecurityService = { findOneByUser: jest.fn() };
  const mockLogger = {
    setContext: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  const mockDataSource = {
    manager: {
      transaction: jest.fn(),
      getRepository: jest.fn().mockReturnValue(mockUsersRepository),
    },
  };

  const mockI18n = {
    t: jest.fn().mockReturnValue('translated text'),
    lang: 'es',
  } as unknown as I18nContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUsersRepository },
        { provide: IdentityTypesService, useValue: mockIdentityTypesService },
        { provide: DynamicQueryService, useValue: mockDynamicQueryService },
        { provide: RolesService, useValue: mockRolesService },
        { provide: OAuthService, useValue: mockOAuthService },
        { provide: DataSource, useValue: mockDataSource },
        { provide: TokensService, useValue: mockTokensService },
        { provide: AuditLogService, useValue: mockAuditLogService },
        {
          provide: EmailChangeRequestService,
          useValue: mockEmailChangeRequestService,
        },
        { provide: SecurityService, useValue: mockSecurityService },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password123',
        document: '12345',
        documentTypeId: 1,
      } as any;

      mockIdentityTypesService.findOne.mockResolvedValue({ data: { id: 1 } });
      mockUsersRepository.findOneBy.mockResolvedValue(null); // Email doesn't exist
      mockRolesService.getNameRoleOrCreate.mockResolvedValue({
        id: 1,
        name: 'user',
      });
      mockUsersRepository.save.mockResolvedValue({ id: 1, ...createUserDto });

      const result = await service.create(createUserDto, mockI18n);

      expect(result).toBeDefined();
      expect(mockUsersRepository.save).toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      const createUserDto = {
        email: 'existing@example.com',
        documentTypeId: 1,
      } as any;
      mockIdentityTypesService.findOne.mockResolvedValue({ data: { id: 1 } });
      mockUsersRepository.findOneBy.mockResolvedValue({
        id: 1,
        email: 'existing@example.com',
      });

      await expect(service.create(createUserDto, mockI18n)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should return a user if found', async () => {
      const user = { id: 1, name: 'Test' } as User;
      mockUsersRepository.findOne.mockResolvedValue(user);

      const result = await service.findById(1, mockI18n);

      expect(result).toEqual(user);
    });
  });

  describe('remove', () => {
    it('should soft delete a user', async () => {
      mockUsersRepository.findOne.mockResolvedValue({ id: 1 });
      mockUsersRepository.softDelete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(1, mockI18n);

      expect(result).toEqual({
        success: true,
        data: null,
        meta: null,
        error: null,
      });
      expect(mockUsersRepository.softDelete).toHaveBeenCalledWith(1);
    });
  });
});
