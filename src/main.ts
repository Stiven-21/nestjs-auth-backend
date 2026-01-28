import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { CustomValidationPipe } from 'src/config/validation.config';
import { I18nValidationExceptionFilter } from 'nestjs-i18n';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'verbose', 'debug', 'fatal'],
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(CustomValidationPipe);
  app.useGlobalFilters(new I18nValidationExceptionFilter());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle(process.env.NAME_APP ?? 'API')
    .setDescription(process.env.DESCRIPTION_APP ?? 'API description')
    .setVersion(process.env.VERSION_APP ?? '1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.APP_PORT || 8080);
}
bootstrap();
