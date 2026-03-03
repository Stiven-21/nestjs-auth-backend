import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { MailService } from 'src/mails/mail.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  // Mock de MailService para no enviar correos reales durante los tests
  const mockMailService = {
    sendMail: jest.fn().mockResolvedValue(true),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue(mockMailService)
      .compile();

    app = moduleFixture.createNestApplication();

    // Es importante incluir los pipes globales si los usas en main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', async () => {
      const registerDto = {
        name: 'E2E',
        lastname: 'Test',
        documentTypeId: 1,
        document: 'E2E' + Date.now(),
        email: `e2e-${Date.now()}@example.com`,
        password: 'Password123!',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(mockMailService.sendMail).toHaveBeenCalled();
    });

    it('should fail validation if email is invalid', async () => {
      const registerDto = {
        name: 'E2E',
        email: 'invalid-email',
        password: '123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
