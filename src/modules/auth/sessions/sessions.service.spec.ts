import { Test, TestingModule } from '@nestjs/testing';
import { AuthSessionsService } from './sessions.service';
import { AuthSessions } from 'src/modules/auth/entities/auth-sessions.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { CreateAuthSessionDto } from '../dto/create-auth-session.dto';
import { internalServerError } from 'src/common/exceptions';

// Mock uuid to avoid ESM parsing issues
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

// Mock internalServerError
jest.mock('src/common/exceptions', () => ({
  ...jest.requireActual('src/common/exceptions'),
  internalServerError: jest.fn(() => {}),
}));

describe('AuthSessionsService', () => {
  let service: AuthSessionsService;
  let mockRepository: jest.Mocked<Repository<AuthSessions>>;

  const mockI18n = {
    lang: 'en',
  } as unknown as I18nContext;

  const userEntity = { id: 1, email: 'test@example.com' } as any;

  const createAuthSessionDto: CreateAuthSessionDto = {
    deviceId: 'device-123',
    user: userEntity,
    ipAddress: '127.0.0.1',
    userAgent: 'Test Agent',
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthSessionsService,
        {
          provide: getRepositoryToken(AuthSessions),
          useValue: {
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthSessionsService>(AuthSessionsService);
    mockRepository = module.get(getRepositoryToken(AuthSessions)) as any;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAuthSession', () => {
    it('should create a new session when no existing session', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue({
        ...createAuthSessionDto,
        id: 1,
        isActive: true,
        expiresAt: new Date(),
      } as any);

      const result = await service.createAuthSession(
        createAuthSessionDto,
        mockI18n,
      );

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          deviceId: createAuthSessionDto.deviceId,
          user: { id: userEntity.id },
        },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createAuthSessionDto,
          deviceId: createAuthSessionDto.deviceId,
        }),
      );
      expect(result).toBeDefined();
    });

    it('should return existing active session', async () => {
      const existingSession = {
        id: 1,
        deviceId: createAuthSessionDto.deviceId,
        user: userEntity,
        isActive: true,
        expiresAt: new Date(),
      } as any;

      mockRepository.findOne.mockResolvedValue(existingSession);

      const result = await service.createAuthSession(
        createAuthSessionDto,
        mockI18n,
      );

      expect(result).toEqual(existingSession);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should reactivate an inactive session', async () => {
      const inactiveSession = {
        id: 1,
        deviceId: createAuthSessionDto.deviceId,
        user: userEntity,
        isActive: false,
        expiresAt: new Date(),
      } as any;

      mockRepository.findOne.mockResolvedValue(inactiveSession);
      mockRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.createAuthSession(
        createAuthSessionDto,
        mockI18n,
      );

      expect(mockRepository.update).toHaveBeenCalledWith(1, { isActive: true });
      expect(result).toEqual(inactiveSession);
    });

    it('should handle findOne error', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('DB error'));

      const result = await service.createAuthSession(
        createAuthSessionDto,
        mockI18n,
      );

      expect(internalServerError).toHaveBeenCalledWith({
        i18n: mockI18n,
        lang: 'en',
      });
      expect(result).toBeUndefined();
    });

    it('should handle save error', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockRejectedValue(new Error('DB error'));

      const result = await service.createAuthSession(
        createAuthSessionDto,
        mockI18n,
      );

      expect(internalServerError).toHaveBeenCalledWith({
        i18n: mockI18n,
        lang: 'en',
      });
      expect(result).toBeUndefined();
    });

    it('should use custom entity manager when provided', async () => {
      const customManager = {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
          save: jest.fn().mockResolvedValue({ id: 1 } as any),
        }),
      } as any;

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue({ id: 1 } as any);

      await service.createAuthSession(
        createAuthSessionDto,
        mockI18n,
        customManager,
      );

      expect(customManager.getRepository).toHaveBeenCalledWith(AuthSessions);
    });

    it('should set expiresAt to 2 days in the future', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      const mockSave = jest.fn().mockResolvedValue({ id: 1 } as any);
      mockRepository.save = mockSave;

      await service.createAuthSession(createAuthSessionDto, mockI18n);

      const savedData = mockSave.mock.calls[0][0];
      expect(savedData.expiresAt).toBeInstanceOf(Date);
      const twoDaysFromNow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      expect(savedData.expiresAt.getTime()).toBeCloseTo(
        twoDaysFromNow.getTime(),
        -3,
      );
    });
  });

  describe('updateActive', () => {
    it('should update session active status', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.updateActive(1, true, mockI18n);

      expect(mockRepository.update).toHaveBeenCalledWith(1, { isActive: true });
      expect(result).toEqual({ affected: 1 });
    });

    it('should handle update error', async () => {
      mockRepository.update.mockRejectedValue(new Error('DB error'));

      const result = await service.updateActive(1, false, mockI18n);

      expect(internalServerError).toHaveBeenCalledWith({
        i18n: mockI18n,
        lang: 'en',
      });
      expect(result).toBeUndefined();
    });

    it('should use custom entity manager when provided', async () => {
      const customManager = {
        getRepository: jest.fn().mockReturnValue({
          update: jest.fn().mockResolvedValue({ affected: 1 } as any),
        }),
      } as any;

      await service.updateActive(1, true, mockI18n, customManager);

      expect(customManager.getRepository).toHaveBeenCalledWith(AuthSessions);
    });
  });

  describe('updateInactiveUserId', () => {
    it('should deactivate all active sessions for a user', async () => {
      const sessions = [
        { id: 1, isActive: true, user: { id: userEntity.id } } as any,
        { id: 2, isActive: true, user: { id: userEntity.id } } as any,
      ];
      mockRepository.find.mockResolvedValue(sessions);
      mockRepository.save.mockResolvedValue(sessions as any);

      await service.updateInactiveUserId(userEntity.id, mockI18n);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          isActive: true,
          user: { id: userEntity.id },
        },
      });
      expect(sessions[0].isActive).toBe(false);
      expect(sessions[1].isActive).toBe(false);
      expect(mockRepository.save).toHaveBeenCalledWith(sessions);
    });

    it('should return early if no active sessions found', async () => {
      mockRepository.find.mockResolvedValue([]);

      await service.updateInactiveUserId(userEntity.id, mockI18n);

      expect(mockRepository.find).toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle find error', async () => {
      mockRepository.find.mockRejectedValue(new Error('DB error'));

      await service.updateInactiveUserId(userEntity.id, mockI18n);

      expect(internalServerError).toHaveBeenCalledWith({
        i18n: mockI18n,
        lang: 'en',
      });
    });

    it('should handle save error', async () => {
      const sessions = [
        { id: 1, isActive: true, user: { id: userEntity.id } } as any,
      ];
      mockRepository.find.mockResolvedValue(sessions);
      mockRepository.save.mockRejectedValue(new Error('DB error'));

      await service.updateInactiveUserId(userEntity.id, mockI18n);

      expect(internalServerError).toHaveBeenCalledWith({
        i18n: mockI18n,
        lang: 'en',
      });
    });

    it('should use custom entity manager when provided', async () => {
      const customManager = {
        getRepository: jest.fn().mockReturnValue({
          find: jest.fn().mockResolvedValue([]),
          save: jest.fn(),
        }),
      } as any;

      await service.updateInactiveUserId(
        userEntity.id,
        mockI18n,
        customManager,
      );

      expect(customManager.getRepository).toHaveBeenCalledWith(AuthSessions);
    });
  });

  describe('findBySessionId', () => {
    it('should find active session by id', async () => {
      const session = {
        id: 1,
        isActive: true,
        deviceId: 'device-123',
      } as any;
      mockRepository.findOne.mockResolvedValue(session);

      const result = await service.findBySessionId(1, mockI18n);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, isActive: true },
      });
      expect(result).toEqual(session);
    });

    it('should return null when session not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findBySessionId(999, mockI18n);

      expect(result).toBeNull();
    });

    it('should handle findOne error', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('DB error'));

      const result = await service.findBySessionId(1, mockI18n);

      expect(internalServerError).toHaveBeenCalledWith({
        i18n: mockI18n,
        lang: 'en',
      });
      expect(result).toBeUndefined();
    });
  });

  describe('findByDeviceId', () => {
    it('should find session by deviceId', async () => {
      const session = {
        id: 1,
        deviceId: 'device-123',
      } as any;
      mockRepository.findOneBy.mockResolvedValue(session);

      const result = await service.findByDeviceId('device-123', mockI18n);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        deviceId: 'device-123',
      });
      expect(result).toEqual(session);
    });

    it('should return null when session not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findByDeviceId('unknown', mockI18n);

      expect(result).toBeNull();
    });

    it('should handle findOneBy error', async () => {
      mockRepository.findOneBy.mockRejectedValue(new Error('DB error'));

      const result = await service.findByDeviceId('device-123', mockI18n);

      expect(internalServerError).toHaveBeenCalledWith({
        i18n: mockI18n,
        lang: 'en',
      });
      expect(result).toBeUndefined();
    });
  });
});
