import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';
import { I18nContext } from 'nestjs-i18n';
import { internalServerError } from 'src/common/exceptions';
import { Logger } from '@nestjs/common';

// Mock the exceptions module to override internalServerError
jest.mock('src/common/exceptions', () => ({
  ...jest.requireActual('src/common/exceptions'),
  internalServerError: jest.fn(() => {}),
}));

describe('MailService', () => {
  let service: MailService;
  let mockMailerService: any;

  const mockI18n = {
    lang: 'en',
  } as unknown as I18nContext;

  beforeEach(async () => {
    mockMailerService = {
      sendMail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMail', () => {
    it('should send an email successfully', async () => {
      const to = 'test@example.com';
      const subject = 'Test Subject';
      const template = 'test-template';
      const context = { name: 'John' };
      mockMailerService.sendMail.mockResolvedValue({});

      await service.sendMail(to, subject, template, context, mockI18n);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to,
        subject,
        template,
        context: {
          ...context,
          appName: process.env.NAME_APP,
        },
      });
    });

    it('should log an error and call internalServerError if sendMail fails', async () => {
      const to = 'test@example.com';
      const subject = 'Test Subject';
      const template = 'test-template';
      const context = { name: 'John' };
      const error = new Error('Mail sending failed');
      mockMailerService.sendMail.mockRejectedValue(error);

      await service.sendMail(to, subject, template, context, mockI18n);

      expect(Logger.prototype.error).toHaveBeenCalledWith(error);
      expect(internalServerError).toHaveBeenCalledWith({
        i18n: mockI18n,
        lang: mockI18n.lang,
      });
    });
  });
});
