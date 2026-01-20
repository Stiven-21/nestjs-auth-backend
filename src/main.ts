import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { CustomValidationPipe } from 'src/config/validation.config';
import { I18nValidationExceptionFilter } from 'nestjs-i18n';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  // app HHTP
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'verbose', 'debug', 'fatal'],
  });

  // Microservice TCP
  // app.connectMicroservice<MicroserviceOptions>({
  //   transport: Transport.TCP,
  //   options: { port: 4002 },
  // });

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

  // Arrancar HTTP + Microservice
  // await app.startAllMicroservices();
  await app.listen(process.env.APP_PORT || 8080);
}
bootstrap();
