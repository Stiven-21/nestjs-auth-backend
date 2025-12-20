import { I18nValidationPipe } from 'nestjs-i18n';

export const CustomValidationPipe = new I18nValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});
