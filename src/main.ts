import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { CustomValidationPipe } from 'src/config/validation.config';
import { I18nValidationExceptionFilter } from 'nestjs-i18n';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { useContainer } from 'class-validator';
import { swaggerConfig } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'verbose', 'debug', 'fatal'],
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(CustomValidationPipe);
  app.useGlobalFilters(new I18nValidationExceptionFilter());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle(swaggerConfig.title ?? 'API')
    .setDescription(swaggerConfig.description ?? 'API description')
    .setVersion(swaggerConfig.version ?? '1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.enableCors({
    origin: process.env.URL_FRONTEND,
    credentials: true,
  });

  app.use(cookieParser());
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  await app.listen(process.env.APP_PORT || 8080);
}
bootstrap();
