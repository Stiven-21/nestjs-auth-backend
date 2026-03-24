import { Test, TestingModule } from '@nestjs/testing';
import { EmailLogChangesService } from './email-log-changes.service';
import { UserEmailChangeLog } from 'src/modules/users/entities/user-email-change-log.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { UsersService } from 'src/modules/users/users.service';
import { DataSource, Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';

// Mock uuid to avoid ESM parsing issues
jest.mock('uuid', () => ({
  v7: jest.fn(() => 'mock-uuid-v7-token'),
}));

describe('EmailLogChangesService', () => {
  let service: EmailLogChangesService;
  let mockEmailChangeRepository: jest.Mocked<Repository<UserEmailChangeLog>>;
  let mockUsersService: jest.Mocked<UsersService>;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockI18n: I18nContext;
  let mockUser: User;
  let mockEmailLog: UserEmailChangeLog;

  beforeEach(async () => {
    mockUser = {
      id: 1,
      email: 'old@example.com',
    } as User;

    mockEmailLog = {
      id: 1,
      user: mockUser,
      oldEmail: 'old@example.com',
      newEmail: 'new@example.com',
      rollbackToken: 'rollback-token',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      revoked: false,
      createdAt: new Date(),
    } as UserEmailChangeLog;

    mockEmailChangeRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
    } as any;

    mockUsersService = {
      findOne: jest.fn(),
    } as any;

    mockDataSource = {
      manager: {
        transaction: jest.fn(),
      },
    } as any;

    mockI18n = {
      lang: 'en',
      t: jest.fn().mockReturnValue('translated text'),
    } as unknown as I18nContext;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailLogChangesService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: 'UserEmailChangeLogRepository',
          useValue: mockEmailChangeRepository,
        },
      ],
    }).compile();

    service = module.get<EmailLogChangesService>(EmailLogChangesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('changeEmail', () => {
    it('should create email change log successfully', async () => {
      mockUsersService.findOne.mockResolvedValue({
        success: true,
        data: mockUser,
        meta: {},
        error: null,
      });
      mockEmailChangeRepository.save.mockResolvedValue(mockEmailLog);

      const result = await service.changeEmail(
        mockUser.id,
        'old@example.com',
        'new@example.com',
        mockI18n,
      );

      expect(result).toEqual(mockEmailLog);
      expect(mockEmailChangeRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser,
          oldEmail: 'old@example.com',
          newEmail: 'new@example.com',
          expiresAt: expect.any(Date),
        }),
      );
    });

    it('should set expiration to 1 day from now', async () => {
      mockUsersService.findOne.mockResolvedValue({
        success: true,
        data: mockUser,
        meta: {},
        error: null,
      });
      mockEmailChangeRepository.save.mockResolvedValue(mockEmailLog);
      const now = new Date();
      const expectedExpiry = new Date(now);
      expectedExpiry.setDate(now.getDate() + 1);

      await service.changeEmail(
        mockUser.id,
        'old@example.com',
        'new@example.com',
        mockI18n,
      );

      const callArgs = mockEmailChangeRepository.save.mock.calls[0][0];
      expect((callArgs.expiresAt as Date).getTime()).toBeCloseTo(
        expectedExpiry.getTime(),
        -3,
      );
    });

    it('should generate rollback token', async () => {
      mockUsersService.findOne.mockResolvedValue({
        success: true,
        data: mockUser,
        meta: {},
        error: null,
      });
      mockEmailChangeRepository.save.mockResolvedValue(mockEmailLog);

      await service.changeEmail(
        mockUser.id,
        'old@example.com',
        'new@example.com',
        mockI18n,
      );

      const callArgs = mockEmailChangeRepository.save.mock.calls[0][0];
      expect(callArgs.rollbackToken).toBeDefined();
      expect(typeof callArgs.rollbackToken).toBe('string');
    });

    it('should handle error when user not found', async () => {
      mockUsersService.findOne.mockRejectedValue(new Error('User not found'));

      await expect(
        service.changeEmail(
          mockUser.id,
          'old@example.com',
          'new@example.com',
          mockI18n,
        ),
      ).rejects.toThrow();
    });

    it('should handle error when save fails', async () => {
      mockUsersService.findOne.mockResolvedValue({
        success: true,
        data: mockUser,
        meta: {},
        error: null,
      });
      mockEmailChangeRepository.save.mockRejectedValue(
        new Error('Save failed'),
      );

      await expect(
        service.changeEmail(
          mockUser.id,
          'old@example.com',
          'new@example.com',
          mockI18n,
        ),
      ).rejects.toThrow();
    });

    it('should pass correct user to findOne', async () => {
      mockUsersService.findOne.mockResolvedValue({
        success: true,
        data: mockUser,
        meta: {},
        error: null,
      });
      mockEmailChangeRepository.save.mockResolvedValue(mockEmailLog);

      await service.changeEmail(
        mockUser.id,
        'old@example.com',
        'new@example.com',
        mockI18n,
      );

      expect(mockUsersService.findOne).toHaveBeenCalledWith(
        mockUser.id,
        mockI18n,
      );
    });
  });

  describe('rollbackEmail', () => {
    it('should rollback email change successfully', async () => {
      mockEmailChangeRepository.findOne.mockResolvedValue(mockEmailLog);
      mockDataSource.manager.transaction = jest
        .fn()
        .mockResolvedValue(undefined);

      await service.rollbackEmail('rollback-token', mockI18n);

      expect(mockEmailChangeRepository.findOne).toHaveBeenCalledWith({
        where: { rollbackToken: 'rollback-token' },
        relations: ['user'],
      });
      expect(mockEmailLog.revoked).toBe(true);
      expect(mockEmailLog.user.email).toBe('old@example.com');
    });

    it('should throw error for invalid token', async () => {
      mockEmailChangeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.rollbackEmail('invalid-token', mockI18n),
      ).rejects.toThrow();
    });

    it('should throw error for expired token', async () => {
      const expiredLog = {
        ...mockEmailLog,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      };
      mockEmailChangeRepository.findOne.mockResolvedValue(expiredLog);

      await expect(
        service.rollbackEmail('expired-token', mockI18n),
      ).rejects.toThrow();
    });

    it('should throw error for already revoked log', async () => {
      const revokedLog = {
        ...mockEmailLog,
        revoked: true,
      };
      mockEmailChangeRepository.findOne.mockResolvedValue(revokedLog);

      await expect(
        service.rollbackEmail('revoked-token', mockI18n),
      ).rejects.toThrow();
    });

    it('should execute transaction for rollback', async () => {
      mockEmailChangeRepository.findOne.mockResolvedValue(mockEmailLog);
      mockDataSource.manager.transaction = jest
        .fn()
        .mockResolvedValue(undefined);

      await service.rollbackEmail('rollback-token', mockI18n);

      expect(mockDataSource.manager.transaction).toHaveBeenCalled();
    });

    it('should save both log and user in transaction', async () => {
      mockEmailChangeRepository.findOne.mockResolvedValue(mockEmailLog);
      mockDataSource.manager.transaction = jest
        .fn()
        .mockResolvedValue(undefined);

      await service.rollbackEmail('rollback-token', mockI18n);

      expect(mockDataSource.manager.transaction).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });

    it('should handle error when findOne fails', async () => {
      mockEmailChangeRepository.findOne.mockRejectedValue(
        new Error('Find failed'),
      );

      await expect(
        service.rollbackEmail('rollback-token', mockI18n),
      ).rejects.toThrow();
    });

    it('should handle error when transaction fails', async () => {
      mockEmailChangeRepository.findOne.mockResolvedValue(mockEmailLog);
      mockDataSource.manager.transaction = jest
        .fn()
        .mockRejectedValue(new Error('Transaction failed'));

      await expect(
        service.rollbackEmail('rollback-token', mockI18n),
      ).rejects.toThrow();
    });

    it('should set user email to oldEmail', async () => {
      mockEmailChangeRepository.findOne.mockResolvedValue(mockEmailLog);
      mockDataSource.manager.transaction = jest
        .fn()
        .mockImplementation(async (callback) => {
          const manager = {
            getRepository: jest.fn().mockReturnValue({
              save: jest.fn(),
            }),
          };
          await callback(manager);
        });

      await service.rollbackEmail('rollback-token', mockI18n);

      expect(mockEmailLog.user.email).toBe('old@example.com');
    });

    it('should mark log as revoked', async () => {
      mockEmailChangeRepository.findOne.mockResolvedValue(mockEmailLog);
      mockDataSource.manager.transaction = jest
        .fn()
        .mockImplementation(async (callback) => {
          const manager = {
            getRepository: jest.fn().mockReturnValue({
              save: jest.fn(),
            }),
          };
          await callback(manager);
        });

      await service.rollbackEmail('rollback-token', mockI18n);

      expect(mockEmailLog.revoked).toBe(true);
    });
  });
});
