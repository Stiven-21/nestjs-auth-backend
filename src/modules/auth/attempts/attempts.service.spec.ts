import { Test, TestingModule } from '@nestjs/testing';
import { AttemptsService } from './attempts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthAttempts } from 'src/modules/auth/entities/auth-attempts.entity';
import { I18nContext } from 'nestjs-i18n';
import { Logger } from '@nestjs/common';

describe('AttemptsService', () => {
  let service: AttemptsService;

  const mockAuthAttemptsRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockI18n = {
    lang: 'en',
    t: jest.fn(),
  } as unknown as I18nContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttemptsService,
        {
          provide: getRepositoryToken(AuthAttempts),
          useValue: mockAuthAttemptsRepository,
        },
        Logger, // Provide Logger to resolve its dependency
      ],
    }).compile();

    service = module.get<AttemptsService>(AttemptsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findEmail', () => {
    it('should return an AuthAttempt if found', async () => {
      const attempt = {
        email: 'test@example.com',
        attempts: 1,
      } as AuthAttempts;
      mockAuthAttemptsRepository.findOne.mockResolvedValue(attempt);

      const result = await service.findEmail('test@example.com', mockI18n);
      expect(result).toEqual(attempt);
      expect(mockAuthAttemptsRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null if no AuthAttempt is found', async () => {
      mockAuthAttemptsRepository.findOne.mockResolvedValue(null);

      const result = await service.findEmail(
        'nonexistent@example.com',
        mockI18n,
      );
      expect(result).toBeNull();
    });
  });

  describe('recordFailure', () => {
    it('should create a new attempt if none exists', async () => {
      mockAuthAttemptsRepository.findOne.mockResolvedValue(null);
      mockAuthAttemptsRepository.create.mockReturnValue({
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
        attempts: 1,
      });

      await service.recordFailure('test@example.com', '127.0.0.1', mockI18n);

      expect(mockAuthAttemptsRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockAuthAttemptsRepository.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
        attempts: 1,
      });
      expect(mockAuthAttemptsRepository.save).toHaveBeenCalled();
    });

    it('should increment attempts if an attempt already exists', async () => {
      const existingAttempt = {
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
        attempts: 1,
        blockedUntil: null,
      } as AuthAttempts;
      mockAuthAttemptsRepository.findOne.mockResolvedValue(existingAttempt);

      await service.recordFailure('test@example.com', '127.0.0.1', mockI18n);

      expect(mockAuthAttemptsRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(existingAttempt.attempts).toBe(2);
      expect(mockAuthAttemptsRepository.save).toHaveBeenCalledWith(
        existingAttempt,
      );
    });

    it('should set blockedUntil for 5 attempts', async () => {
      const existingAttempt = {
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
        attempts: 4,
        blockedUntil: null,
      } as AuthAttempts;
      mockAuthAttemptsRepository.findOne.mockResolvedValue(existingAttempt);

      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);

      await service.recordFailure('test@example.com', '127.0.0.1', mockI18n);

      expect(existingAttempt.attempts).toBe(5);
      expect(existingAttempt.blockedUntil).toEqual(
        new Date(now.getTime() + 5 * 60 * 1000),
      );
      jest.useRealTimers();
    });

    it('should set blockedUntil for 10 attempts', async () => {
      const existingAttempt = {
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
        attempts: 9,
        blockedUntil: null,
      } as AuthAttempts;
      mockAuthAttemptsRepository.findOne.mockResolvedValue(existingAttempt);

      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);

      await service.recordFailure('test@example.com', '127.0.0.1', mockI18n);

      expect(existingAttempt.attempts).toBe(10);
      expect(existingAttempt.blockedUntil).toEqual(
        new Date(now.getTime() + 30 * 60 * 1000),
      );
      jest.useRealTimers();
    });

    it('should set blockedUntil for 15 attempts', async () => {
      const existingAttempt = {
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
        attempts: 14,
        blockedUntil: null,
      } as AuthAttempts;
      mockAuthAttemptsRepository.findOne.mockResolvedValue(existingAttempt);

      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);

      await service.recordFailure('test@example.com', '127.0.0.1', mockI18n);

      expect(existingAttempt.attempts).toBe(15);
      expect(existingAttempt.blockedUntil).toEqual(
        new Date(now.getTime() + 24 * 60 * 60 * 1000),
      );
      jest.useRealTimers();
    });
  });

  describe('reset', () => {
    it('should delete attempts for a given email', async () => {
      await service.reset('test@example.com', mockI18n);
      expect(mockAuthAttemptsRepository.delete).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });
  });
});
