import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from './session.service';
import { UserSession } from 'src/modules/users/entities/user-session.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { CreateSessionDto } from 'src/modules/users/dto/create-session.dto';
import { DynamicQueryDto } from 'src/common/services/query/dto/dynamic.dto';
import { UsersService } from 'src/modules/users/users.service';
import { DynamicQueryService } from 'src/common/services/query/dynamic.service';
import { I18nContext } from 'nestjs-i18n';

// Mock uuid to avoid ESM parsing issues
jest.mock('uuid', () => ({
  v7: jest.fn(() => 'mock-uuid-v7-token'),
}));

describe('SessionService', () => {
  let service: SessionService;
  let mockSessionRepository: any;
  let mockUsersService: any;
  let mockDynamicQueryService: any;
  let mockI18n: I18nContext;
  let mockUser: User;
  let mockSession: UserSession;
  let mockCreateSessionDto: CreateSessionDto;
  let mockDynamicQueryDto: DynamicQueryDto;
  let mockQueryResult: any;

  beforeEach(async () => {
    mockUser = {
      id: 1,
      email: 'test@example.com',
    } as User;

    mockSession = {
      id: 1,
      user: mockUser,
      ip: '127.0.0.1',
      device: 'device-id',
      userAgent: 'Mozilla/5.0',
      location: null,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    } as UserSession;

    mockCreateSessionDto = {
      userId: 1,
      ip: '127.0.0.1',
      device: 'device-id',
      userAgent: 'Mozilla/5.0',
      location: null,
    };

    mockDynamicQueryDto = {
      page: 1,
      limit: 10,
      sort: 'createdAt:DESC',
    };

    mockQueryResult = {
      data: [mockSession],
      total: 1,
    };

    mockSessionRepository = {
      save: jest.fn(),
      find: jest.fn(),
    } as any;

    mockUsersService = {
      findOne: jest.fn(),
    } as any;

    mockDynamicQueryService = {
      findAndCount: jest.fn(),
    } as any;

    mockI18n = {
      lang: 'en',
      t: jest.fn().mockReturnValue('translated text'),
    } as unknown as I18nContext;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: DynamicQueryService,
          useValue: mockDynamicQueryService,
        },
        {
          provide: 'UserSessionRepository',
          useValue: mockSessionRepository,
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create session successfully', async () => {
      mockUsersService.findOne.mockResolvedValue({
        success: true,
        data: mockUser,
        meta: {},
        error: null,
      });
      mockSessionRepository.save.mockResolvedValue(mockSession);

      const result = await service.create(mockCreateSessionDto, mockI18n);

      expect(result).toEqual({
        success: true,
        data: null,
        error: null,
        meta: null,
      });
      expect(mockSessionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser,
          expiresAt: expect.any(Date),
          ip: mockCreateSessionDto.ip,
          device: mockCreateSessionDto.device,
          userAgent: mockCreateSessionDto.userAgent,
        }),
      );
    });

    it('should set expiration to 24 hours from now', async () => {
      mockUsersService.findOne.mockResolvedValue({
        success: true,
        data: mockUser,
        meta: {},
        error: null,
      });
      mockSessionRepository.save.mockResolvedValue(mockSession);
      const now = Date.now();

      await service.create(mockCreateSessionDto, mockI18n);

      const callArgs = mockSessionRepository.save.mock.calls[0][0];
      const expectedExpiry = new Date(now + 24 * 60 * 60 * 1000);
      expect((callArgs.expiresAt as Date).getTime()).toBeCloseTo(
        expectedExpiry.getTime(),
        -3,
      );
    });

    it('should handle error when user not found', async () => {
      mockUsersService.findOne.mockRejectedValue(new Error('User not found'));

      await expect(
        service.create(mockCreateSessionDto, mockI18n),
      ).rejects.toThrow();
    });

    it('should handle error when save fails', async () => {
      mockUsersService.findOne.mockResolvedValue({
        success: true,
        data: mockUser,
        meta: {},
        error: null,
      });
      mockSessionRepository.save.mockRejectedValue(new Error('Save failed'));

      await expect(
        service.create(mockCreateSessionDto, mockI18n),
      ).rejects.toThrow();
    });

    it('should return noContentResponse on success', async () => {
      mockUsersService.findOne.mockResolvedValue({
        success: true,
        data: mockUser,
        meta: {},
        error: null,
      });
      mockSessionRepository.save.mockResolvedValue(mockSession);

      const result = await service.create(mockCreateSessionDto, mockI18n);

      expect(result).toEqual({
        success: true,
        data: null,
        error: null,
        meta: null,
      });
    });

    it('should pass all DTO properties to repository', async () => {
      mockUsersService.findOne.mockResolvedValue({
        success: true,
        data: mockUser,
        meta: {},
        error: null,
      });
      mockSessionRepository.save.mockResolvedValue(mockSession);

      await service.create(mockCreateSessionDto, mockI18n);

      expect(mockSessionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser,
          ip: mockCreateSessionDto.ip,
          device: mockCreateSessionDto.device,
          userAgent: mockCreateSessionDto.userAgent,
          location: mockCreateSessionDto.location,
        }),
      );
    });
  });

  describe('findByUserId', () => {
    it('should find sessions by user id successfully', async () => {
      mockUsersService.findOne.mockResolvedValue({
        success: true,
        data: mockUser,
        meta: {},
        error: null,
      });
      mockDynamicQueryService.findAndCount.mockResolvedValue(mockQueryResult);

      const result = await service.findByUserId(
        mockDynamicQueryDto,
        mockUser.id,
        mockI18n,
      );

      expect(result).toEqual({
        success: true,
        data: [mockSession],
        error: null,
        meta: { total: 1 },
      });
      expect(mockDynamicQueryService.findAndCount).toHaveBeenCalledWith(
        mockSessionRepository,
        expect.objectContaining({ 'user.id': mockUser.id }),
        mockDynamicQueryDto.page,
        mockDynamicQueryDto.limit,
        mockI18n,
        mockDynamicQueryDto.sort,
      );
    });

    it('should pass correct filters with user id', async () => {
      mockUsersService.findOne.mockResolvedValue({
        success: true,
        data: mockUser,
        meta: {},
        error: null,
      });
      mockDynamicQueryService.findAndCount.mockResolvedValue(mockQueryResult);

      await service.findByUserId(mockDynamicQueryDto, mockUser.id, mockI18n);

      expect(mockDynamicQueryService.findAndCount).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ 'user.id': mockUser.id }),
        expect.any(Number),
        expect.any(Number),
        expect.any(Object),
        expect.any(String),
      );
    });

    it('should handle error when user not found', async () => {
      mockUsersService.findOne.mockRejectedValue(new Error('User not found'));

      await expect(
        service.findByUserId(mockDynamicQueryDto, mockUser.id, mockI18n),
      ).rejects.toThrow();
    });

    it('should handle error when findAndCount fails', async () => {
      mockUsersService.findOne.mockResolvedValue({
        success: true,
        data: mockUser,
        meta: {},
        error: null,
      });
      mockDynamicQueryService.findAndCount.mockRejectedValue(
        new Error('Query failed'),
      );

      await expect(
        service.findByUserId(mockDynamicQueryDto, mockUser.id, mockI18n),
      ).rejects.toThrow();
    });

    it('should return okResponse with data and meta', async () => {
      mockUsersService.findOne.mockResolvedValue({
        success: true,
        data: mockUser,
        meta: {},
        error: null,
      });
      mockDynamicQueryService.findAndCount.mockResolvedValue(mockQueryResult);

      const result = await service.findByUserId(
        mockDynamicQueryDto,
        mockUser.id,
        mockI18n,
      );

      expect(result).toEqual({
        success: true,
        data: [mockSession],
        error: null,
        meta: { total: 1 },
      });
    });

    it('should extract page, limit, sort, and filters from query', async () => {
      mockUsersService.findOne.mockResolvedValue({
        success: true,
        data: mockUser,
        meta: {},
        error: null,
      });
      mockDynamicQueryService.findAndCount.mockResolvedValue(mockQueryResult);

      await service.findByUserId(mockDynamicQueryDto, mockUser.id, mockI18n);

      expect(mockDynamicQueryService.findAndCount).toHaveBeenCalledWith(
        mockSessionRepository,
        expect.objectContaining({
          'user.id': mockUser.id,
        }),
        mockDynamicQueryDto.page,
        mockDynamicQueryDto.limit,
        mockI18n,
        mockDynamicQueryDto.sort,
      );
    });
  });
});
