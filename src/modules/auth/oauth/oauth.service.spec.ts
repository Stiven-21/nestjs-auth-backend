import { Test, TestingModule } from '@nestjs/testing';
import { OAuthStateService, OAuthStatePayload } from './oauth.service';
import * as jwt from 'jsonwebtoken';
import { ResponseFactory } from 'src/common/exceptions/response.factory';
import { Logger } from '@nestjs/common';

jest.mock('jsonwebtoken');
jest.mock('nestjs-i18n', () => ({
  I18nContext: {
    current: jest.fn(() => ({
      lang: 'en',
    })),
  },
}));
jest.mock('src/common/exceptions/response.factory', () => ({
  ResponseFactory: {
    error: jest.fn(),
  },
}));

describe('OAuthStateService', () => {
  let service: OAuthStateService;

  beforeEach(async () => {
    process.env.OAUTH_STATE_SECRET = 'test-secret';

    const module: TestingModule = await Test.createTestingModule({
      providers: [OAuthStateService, Logger],
    }).compile();

    service = module.get<OAuthStateService>(OAuthStateService);
    // Spy on Logger prototype to capture all logger error calls
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockRestore();
    delete process.env.OAUTH_STATE_SECRET;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sign', () => {
    it('should sign a payload with a secret and return a token', () => {
      const payload: OAuthStatePayload = { flow: 'login', userId: 1 };
      const expectedToken = 'mocked-jwt-token';
      (jwt.sign as jest.Mock).mockReturnValue(expectedToken);

      const result = service.sign(payload);

      expect(result).toBe(expectedToken);
      expect(jwt.sign).toHaveBeenCalledWith(payload, 'test-secret', {
        expiresIn: '5m',
        issuer: 'auth-service',
      });
    });

    it('should throw an error if OAUTH_STATE_SECRET is missing', async () => {
      delete process.env.OAUTH_STATE_SECRET;
      // Create a new instance to pick up the deleted env var
      const newService = new OAuthStateService();

      expect(() => newService.sign({ flow: 'login' })).toThrow();
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Missing OAUTH_STATE_SECRET',
      );
    });

    it('should log an error if jwt.sign fails', async () => {
      (jwt.sign as jest.Mock).mockImplementation(() => {
        throw new Error('JWT Sign Error');
      });

      expect(() => service.sign({ flow: 'login' })).toThrow();
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'JWT Sign Error' }),
      );
    });
  });

  describe('verify', () => {
    it('should verify a token and return the payload', () => {
      const token = 'valid-token';
      const payload: OAuthStatePayload = { flow: 'login', userId: 1 };
      (jwt.verify as jest.Mock).mockReturnValue(payload);

      const result = service.verify(token);

      expect(result).toEqual(payload);
      expect(jwt.verify).toHaveBeenCalledWith(token, 'test-secret');
    });

    it('should call ResponseFactory.error if verification fails', () => {
      const token = 'invalid-token';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('JWT Verify Error');
      });

      service.verify(token);

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'JWT Verify Error' }),
      );
      expect(ResponseFactory.error).toHaveBeenCalledWith({
        i18n: expect.any(Object),
        lang: 'en',
        code: 'INVALID_STATE',
      });
    });
  });
});
