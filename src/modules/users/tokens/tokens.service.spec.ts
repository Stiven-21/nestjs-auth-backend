import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TokensService } from 'src/modules/users/tokens/tokens.service';
import { UserToken } from 'src/modules/users/entities/user-tokens.entity';
import { UsersService } from 'src/modules/users/users.service';
import { MailService } from 'src/mails/mail.service';
import { I18nContext } from 'nestjs-i18n';
import { UserTokenEnum } from 'src/common/enum/user-token.enum';

// Mock de uuid para evitar errores de ESM en Jest
jest.mock('uuid', () => ({
  v7: jest.fn().mockReturnValue('mocked-uuid-v7'),
}));

describe('TokensService', () => {
  let service: TokensService;

  const mockTokensRepository = {
    save: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
  };

  const mockUsersService = {
    findOneByEmail: jest.fn(),
  };

  const mockMailService = {
    sendMail: jest.fn(),
  };

  const mockI18n = {
    t: jest.fn().mockReturnValue('translated text'),
    lang: 'es',
  } as unknown as I18nContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokensService,
        {
          provide: getRepositoryToken(UserToken),
          useValue: mockTokensRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<TokensService>(TokensService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTokenEmailVerification', () => {
    it('should create an email verification token and send an email', async () => {
      const user = { id: 1, email: 'test@example.com' } as any;
      const userToken = { id: 1, token: 'uuid', user } as UserToken;
      mockTokensRepository.save.mockResolvedValue(userToken);

      const result = await service.createTokenEmailVerification(
        { user },
        mockI18n,
      );

      expect(result).toEqual(userToken);
      expect(mockTokensRepository.save).toHaveBeenCalled();
      expect(mockMailService.sendMail).toHaveBeenCalledWith(
        user.email,
        expect.any(String),
        'auth-verification',
        expect.any(Object),
        mockI18n,
      );
    });
  });

  describe('createTokenPasswordReset', () => {
    it('should create a password reset token and send an email', async () => {
      const email = 'test@example.com';
      const user = { id: 1, email } as any;
      mockUsersService.findOneByEmail.mockResolvedValue(user);
      mockTokensRepository.save.mockResolvedValue({});

      await service.createTokenPasswordReset(email, mockI18n);

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(
        email,
        mockI18n,
      );
      expect(mockTokensRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user,
          type: UserTokenEnum.PASSWORD_RESET,
        }),
      );
      expect(mockMailService.sendMail).toHaveBeenCalledWith(
        email,
        expect.any(String),
        'auth-reset-password',
        expect.any(Object),
        mockI18n,
      );
    });
  });

  describe('findOneByToken', () => {
    it('should return token if valid', async () => {
      const token = 'valid-token';
      const userToken = {
        token,
        isUsed: false,
        expiresAt: new Date(Date.now() + 10000),
      } as UserToken;
      mockTokensRepository.findOneBy.mockResolvedValue(userToken);

      const result = await service.findOneByToken(token, mockI18n);

      expect(result).toEqual({
        success: true,
        data: userToken,
        meta: null,
        error: null,
      });
    });

    it('should throw error if token is expired', async () => {
      const token = 'expired-token';
      const userToken = {
        token,
        isUsed: false,
        expiresAt: new Date(Date.now() - 10000),
      } as UserToken;
      mockTokensRepository.findOneBy.mockResolvedValue(userToken);

      await expect(service.findOneByToken(token, mockI18n)).rejects.toThrow();
    });

    it('should throw error if token is already used', async () => {
      const token = 'used-token';
      const userToken = {
        token,
        isUsed: true,
        expiresAt: new Date(Date.now() + 10000),
      } as UserToken;
      mockTokensRepository.findOneBy.mockResolvedValue(userToken);

      await expect(service.findOneByToken(token, mockI18n)).rejects.toThrow();
    });
  });
});
