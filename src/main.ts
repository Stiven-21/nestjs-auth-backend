import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { CustomValidationPipe } from 'src/config/validation.config';
import { I18nValidationExceptionFilter } from 'nestjs-i18n';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { useContainer } from 'class-validator';
import { packageJson, swaggerConfig } from './config/swagger.config';
import { Logger } from '@nestjs/common';
import { SUPPORTED_LANGUAGES } from './common/constants/i18n.constants';

/**
 * Bootstraps and starts the NestJS application.
 */
async function bootstrap() {
  /**
   * Create NestJS application instance.
   * Logger levels depend on environment:
   * - Development: full logs
   * - Production: only errors and warnings
   */
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV !== 'production'
        ? ['error', 'warn', 'log', 'verbose', 'debug']
        : ['error', 'warn'],
  });

  /**
   * Create application logger instance
   */
  const logger = new Logger(process.env.APP_NAME);

  /**
   * Set global API prefix for versioning.
   * All routes will be prefixed with /api/v1
   */
  app.setGlobalPrefix('api/v1');

  /**
   * Apply global validation pipe.
   * Ensures all incoming requests are validated
   * according to DTO definitions.
   */
  app.useGlobalPipes(CustomValidationPipe);

  /**
   * Apply global i18n validation exception filter.
   * Translates validation errors into the configured language.
   */
  app.useGlobalFilters(new I18nValidationExceptionFilter());

  /**
   * Swagger (OpenAPI) Configuration
   * ----------------------------------------
   * Builds API documentation with:
   * - Title
   * - Description
   * - Version
   * - JWT Bearer Authentication
   */
  const config = new DocumentBuilder()
    .setTitle(swaggerConfig.title ?? 'API')
    .setDescription(swaggerConfig.description ?? 'API description')
    .setVersion(swaggerConfig.version ?? '1.0')
    .setContact(
      swaggerConfig.contact?.name,
      swaggerConfig.contact?.url,
      swaggerConfig.contact?.email,
    )
    .setLicense(swaggerConfig.license?.name, swaggerConfig.license?.url)
    .addBearerAuth()
    .addGlobalParameters({
      name: 'accept-language',
      in: 'header',
      required: false,
      schema: {
        type: 'string',
        enum: SUPPORTED_LANGUAGES,
        example: 'es',
      },
      description: 'Language code (ISO 639-1)',
    })
    .build();

  /**
   * Generate Swagger document
   */
  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
    operationIdFactory: (controllerKey, methodKey) =>
      `${controllerKey}_${methodKey}`,
  });

  /**
   * Setup Swagger UI at /api/docs
   */
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'NestAuth API Documentation',
  });

  /**
   * Enable Cross-Origin Resource Sharing (CORS)
   * Allows requests only from configured frontend URL.
   * Credentials enabled for cookies/authentication.
   */
  app.enableCors({
    origin: process.env.URL_FRONTEND,
    credentials: true,
  });

  /**
   * Enable cookie parsing middleware.
   * Required for handling authentication cookies.
   */
  app.use(cookieParser());

  /**
   * Allow dependency injection in custom validators.
   * Required for advanced class-validator use cases.
   */
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  /**
   * Define application port.
   * Defaults to 3000 if not specified.
   */
  const port = process.env.APP_PORT || 3000;

  /**
   * Start listening on all network interfaces.
   * Required for Docker and cloud environments.
   */
  await app.listen(port, '0.0.0.0');

  /**
   * Log runtime application information.
   */
  logger.log(`🚀 App running on: ${await app.getUrl()}`);
  logger.log(`📦 Version: ${packageJson.version}`);
  logger.log(`🌎 Environment: ${process.env.NODE_ENV}`);
  logger.log(`🧠 PID: ${process.pid}`);
}

/**
 * Initialize application
 */
bootstrap();
