import { Test, TestingModule } from '@nestjs/testing';
import { EmailChangeRequestService } from './email-change-request.service';
import { UserEmailChangeRequest } from 'src/modules/users/entities/user-email-change-request.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { UsersService } from 'src/modules/users/users.service';
import { EmailLogChangesService } from 'src/modules/users/email-log-changes/email-log-changes.service';
import { MailService } from 'src/mails/mail.service';
import { DataSource } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import * as crypto from 'crypto';

jest.mock('uuid', () => ({
  v7: jest.fn().mockReturnValue('123e4567-e89b-12d3-a456-426614174000'),
}));

describe('EmailChangeRequestService', () => {
  let service: EmailChangeRequestService;
  let mockEmailChangeRepository: any;
  let mockUsersService: any;
  let mockEmailLogChangesService: any;
  let mockMailService: any;
  let mockDataSource: any;
  let mockI18n: I18nContext;
  let mockUser: User;
  let mockEmailChangeRequest: UserEmailChangeRequest;
  let mockEmailLog: any;
  let mockUpdateResult: any;

  beforeEach(async () => {
    mockUser = {
      id: 1,
      email: 'old@example.com',
    } as User;

    mockEmailChangeRequest = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user: mockUser,
      oldEmail: 'old@example.com',
      newEmail: 'new@example.com',
      tokenHash: 'hashed-token',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      used: false,
      createdAt: new Date(),
    } as UserEmailChangeRequest;

    mockEmailLog = {
      id: 1,
      user: mockUser,
      oldEmail: 'old@example.com',
      newEmail: 'new@example.com',
      rollbackToken: 'rollback-token',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      revoked: false,
      createdAt: new Date(),
    };

    mockUpdateResult = { affected: 1, raw: {}, generatedMaps: [] };

    mockEmailChangeRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockUsersService = {
      findById: jest.fn(),
      updateEmail: jest.fn(),
    } as any;

    mockEmailLogChangesService = {
      changeEmail: jest.fn(),
    } as any;

    mockMailService = {
      sendMail: jest.fn(),
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

    jest.spyOn(crypto, 'createHash').mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: () => 'hashed-token',
    } as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailChangeRequestService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: EmailLogChangesService,
          useValue: mockEmailLogChangesService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: 'UserEmailChangeRequestRepository',
          useValue: mockEmailChangeRepository,
        },
      ],
    }).compile();

    service = module.get<EmailChangeRequestService>(EmailChangeRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create email change request successfully', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockEmailChangeRepository.save.mockResolvedValue(mockEmailChangeRequest);

      const result = await service.create(
        mockUser,
        'old@example.com',
        'new@example.com',
        mockI18n,
      );

      expect(result).toEqual(mockEmailChangeRequest);
      expect(mockEmailChangeRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser,
          oldEmail: 'old@example.com',
          newEmail: 'new@example.com',
          expiresAt: expect.any(Date),
        }),
      );
      expect(mockMailService.sendMail).toHaveBeenCalledWith(
        'old@example.com',
        'Solicitud de cambio de correo',
        'user-change-email-request',
        expect.objectContaining({
          oldEmail: 'old@example.com',
          newEmail: 'new@example.com',
          authorizationUrl: expect.stringContaining(
            '123e4567-e89b-12d3-a456-426614174000',
          ),
        }),
        mockI18n,
      );
    });

    it('should set expiration to 1 day from now', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockEmailChangeRepository.save.mockResolvedValue(mockEmailChangeRequest);
      const now = new Date();
      const expectedExpiry = new Date(now);
      expectedExpiry.setDate(now.getDate() + 1);

      await service.create(
        mockUser,
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

    it('should hash the token before saving', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockEmailChangeRepository.save.mockResolvedValue(mockEmailChangeRequest);

      await service.create(
        mockUser,
        'old@example.com',
        'new@example.com',
        mockI18n,
      );

      expect(crypto.createHash).toHaveBeenCalledWith('sha256');
    });

    it('should send email with correct template and data', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockEmailChangeRepository.save.mockResolvedValue(mockEmailChangeRequest);

      await service.create(
        mockUser,
        'old@example.com',
        'new@example.com',
        mockI18n,
      );

      expect(mockMailService.sendMail).toHaveBeenCalledWith(
        'old@example.com',
        'Solicitud de cambio de correo',
        'user-change-email-request',
        {
          oldEmail: 'old@example.com',
          newEmail: 'new@example.com',
          authorizationUrl: expect.stringMatching(
            /\/email-change-request\/verify\/123e4567-e89b-12d3-a456-426614174000/,
          ),
        },
        mockI18n,
      );
    });

    it('should handle error when save fails', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockEmailChangeRepository.save.mockRejectedValue(
        new Error('Save failed'),
      );

      await expect(
        service.create(
          mockUser,
          'old@example.com',
          'new@example.com',
          mockI18n,
        ),
      ).rejects.toThrow();
    });

    it('should handle error when mail service fails', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockEmailChangeRepository.save.mockResolvedValue(mockEmailChangeRequest);
      mockMailService.sendMail.mockRejectedValue(new Error('Mail failed'));

      await expect(
        service.create(
          mockUser,
          'old@example.com',
          'new@example.com',
          mockI18n,
        ),
      ).rejects.toThrow();
    });

    it('should use frontend URL from environment', async () => {
      // Set the frontend URL env var
      process.env.URL_FRONTEND = 'http://test.frontend.com';
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockEmailChangeRepository.save.mockResolvedValue(mockEmailChangeRequest);

      await service.create(
        mockUser,
        'old@example.com',
        'new@example.com',
        mockI18n,
      );

      // The token is generated by uuidv7 mock: '123e4567-e89b-12d3-a456-426614174000'
      const expectedUrl =
        'http://test.frontend.com/email-change-request/verify/123e4567-e89b-12d3-a456-426614174000';
      expect(mockMailService.sendMail).toHaveBeenCalledWith(
        'old@example.com',
        'Solicitud de cambio de correo',
        'user-change-email-request',
        expect.objectContaining({
          authorizationUrl: expectedUrl,
        }),
        mockI18n,
      );
    });
  });

  describe('changeEmail', () => {
    it('should change email successfully with valid token', async () => {
      // Setup transaction to execute callback with a manager that has save mocks
      const mockTransactionManager = {
        getRepository: jest.fn().mockReturnValue({
          save: jest.fn().mockResolvedValue(undefined),
        }),
      };
      mockDataSource.manager.transaction = jest
        .fn()
        .mockImplementation(async (callback) => {
          return await callback(mockTransactionManager);
        });

      mockEmailChangeRepository.findOne.mockResolvedValue(
        mockEmailChangeRequest,
      );
      mockEmailLogChangesService.changeEmail.mockResolvedValue(mockEmailLog);
      mockUsersService.updateEmail.mockResolvedValue(mockUpdateResult);

      const result = await service.changeEmail('valid-token', mockI18n);

      expect(result).toEqual({
        success: true,
        data: null,
        error: null,
        meta: null,
      });
      expect(mockEmailChangeRepository.findOne).toHaveBeenCalledWith({
        where: { tokenHash: 'hashed-token' },
        select: ['id', 'user', 'oldEmail', 'newEmail', 'expiresAt', 'used'],
      });
      expect(mockEmailLogChangesService.changeEmail).toHaveBeenCalledWith(
        mockUser.id,
        'old@example.com',
        'new@example.com',
        mockI18n,
        expect.any(Object),
      );
      expect(mockUsersService.updateEmail).toHaveBeenCalledWith(
        mockUser.id,
        'new@example.com',
        mockI18n,
        expect.any(Object),
      );
      expect(mockEmailChangeRequest.used).toBe(true);
    });

    it('should throw error for invalid token', async () => {
      mockEmailChangeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.changeEmail('invalid-token', mockI18n),
      ).rejects.toThrow();
    });

    it('should throw error for expired token', async () => {
      const expiredRequest = {
        ...mockEmailChangeRequest,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      };
      mockEmailChangeRepository.findOne.mockResolvedValue(expiredRequest);

      await expect(
        service.changeEmail('expired-token', mockI18n),
      ).rejects.toThrow();
    });

    it('should throw error for used token', async () => {
      const usedRequest = {
        ...mockEmailChangeRequest,
        used: true,
      };
      mockEmailChangeRepository.findOne.mockResolvedValue(usedRequest);

      await expect(
        service.changeEmail('used-token', mockI18n),
      ).rejects.toThrow();
    });

    it('should execute transaction for email change', async () => {
      mockDataSource.manager.transaction = jest
        .fn()
        .mockResolvedValue('rollback-token');

      mockEmailChangeRepository.findOne.mockResolvedValue(
        mockEmailChangeRequest,
      );
      mockEmailLogChangesService.changeEmail.mockResolvedValue(mockEmailLog);
      mockUsersService.updateEmail.mockResolvedValue(mockUpdateResult);

      await service.changeEmail('valid-token', mockI18n);

      expect(mockDataSource.manager.transaction).toHaveBeenCalled();
    });

    it('should send confirmation email after successful change', async () => {
      // Setup transaction to execute callback with a manager that has save mocks
      const mockTransactionManager = {
        getRepository: jest.fn().mockReturnValue({
          save: jest.fn().mockResolvedValue(undefined),
        }),
      };
      mockDataSource.manager.transaction = jest
        .fn()
        .mockImplementation(async (callback) => {
          return await callback(mockTransactionManager);
        });

      mockEmailChangeRepository.findOne.mockResolvedValue(
        mockEmailChangeRequest,
      );
      mockEmailLogChangesService.changeEmail.mockResolvedValue({
        ...mockEmailLog,
        rollbackToken: 'rollback-token',
      });
      mockUsersService.updateEmail.mockResolvedValue(mockUpdateResult);

      await service.changeEmail('valid-token', mockI18n);

      expect(mockMailService.sendMail).toHaveBeenCalledWith(
        'old@example.com',
        'Cambio de correo electrónico',
        'auth-email-update',
        expect.objectContaining({
          oldEmail: 'old@example.com',
          newEmail: 'new@example.com',
          revertLink: expect.stringContaining('rollback-token'),
        }),
        mockI18n,
      );
    });

    it('should handle error when findOne fails', async () => {
      mockEmailChangeRepository.findOne.mockRejectedValue(
        new Error('Find failed'),
      );

      await expect(
        service.changeEmail('valid-token', mockI18n),
      ).rejects.toThrow();
    });

    it('should handle error when email log change fails', async () => {
      // Setup transaction to execute callback with a manager that has save mocks
      const mockTransactionManager = {
        getRepository: jest.fn().mockReturnValue({
          save: jest.fn().mockResolvedValue(undefined),
        }),
      };
      mockDataSource.manager.transaction = jest
        .fn()
        .mockImplementation(async (callback) => {
          return await callback(mockTransactionManager);
        });

      mockEmailChangeRepository.findOne.mockResolvedValue(
        mockEmailChangeRequest,
      );
      mockEmailLogChangesService.changeEmail.mockRejectedValue(
        new Error('Log failed'),
      );

      await expect(
        service.changeEmail('valid-token', mockI18n),
      ).rejects.toThrow();
    });

    it('should handle error when update email fails', async () => {
      // Setup transaction to execute callback with a manager that has save mocks
      const mockTransactionManager = {
        getRepository: jest.fn().mockReturnValue({
          save: jest.fn().mockResolvedValue(undefined),
        }),
      };
      mockDataSource.manager.transaction = jest
        .fn()
        .mockImplementation(async (callback) => {
          return await callback(mockTransactionManager);
        });

      mockEmailChangeRepository.findOne.mockResolvedValue(
        mockEmailChangeRequest,
      );
      mockEmailLogChangesService.changeEmail.mockResolvedValue(mockEmailLog);
      mockUsersService.updateEmail.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(
        service.changeEmail('valid-token', mockI18n),
      ).rejects.toThrow();
    });

    it('should handle error when marking as used fails', async () => {
      // Setup transaction with a manager whose save for UserEmailChangeRequest rejects
      const mockSave = jest.fn().mockRejectedValue(new Error('Save failed'));
      const mockTransactionManager = {
        getRepository: jest.fn().mockReturnValue({
          save: mockSave,
        }),
      };
      mockDataSource.manager.transaction = jest
        .fn()
        .mockImplementation(async (callback) => {
          return await callback(mockTransactionManager);
        });

      mockEmailChangeRepository.findOne.mockResolvedValue(
        mockEmailChangeRequest,
      );
      mockEmailLogChangesService.changeEmail.mockResolvedValue(mockEmailLog);
      mockUsersService.updateEmail.mockResolvedValue(mockUpdateResult);

      await expect(
        service.changeEmail('valid-token', mockI18n),
      ).rejects.toThrow();
    });

    it('should hash token before querying', async () => {
      mockEmailChangeRepository.findOne.mockResolvedValue(
        mockEmailChangeRequest,
      );
      mockEmailLogChangesService.changeEmail.mockResolvedValue(mockEmailLog);
      mockUsersService.updateEmail.mockResolvedValue(mockUpdateResult);

      await service.changeEmail('valid-token', mockI18n);

      expect(mockEmailChangeRepository.findOne).toHaveBeenCalledWith({
        where: { tokenHash: 'hashed-token' },
        select: ['id', 'user', 'oldEmail', 'newEmail', 'expiresAt', 'used'],
      });
    });

    it('should use transaction manager for all operations', async () => {
      const mockTransactionManager = {
        getRepository: jest.fn().mockReturnValue({
          save: jest.fn().mockResolvedValue(undefined),
        }),
      };

      mockDataSource.manager.transaction = jest
        .fn()
        .mockImplementation(async (callback) => {
          return await callback(mockTransactionManager);
        });

      mockEmailChangeRepository.findOne.mockResolvedValue(
        mockEmailChangeRequest,
      );
      mockEmailLogChangesService.changeEmail.mockResolvedValue(mockEmailLog);
      mockUsersService.updateEmail.mockResolvedValue(mockUpdateResult);

      await service.changeEmail('valid-token', mockI18n);

      expect(mockDataSource.manager.transaction).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });
  });
});
