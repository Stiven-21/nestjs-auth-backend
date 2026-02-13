import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Response } from 'express';
import { DEFAULT_LANGUAGE } from 'src/common/constants/i18n.constants';
import { ConfigService } from '@nestjs/config';

@Catch(BadRequestException)
export class ValidationFilter implements ExceptionFilter {
  constructor(
    private readonly i18n: I18nService,
    private readonly configService: ConfigService,
  ) {}

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const lang =
      req['language'] ||
      req.headers?.['x-custom-lang'] ||
      req.headers?.['accept-language'] ||
      this.configService.get('I18N_FALLBACK_LANGUAGE') ||
      DEFAULT_LANGUAGE;

    if (this.isValidationError(exceptionResponse['message'])) {
      const translatedErrors = this.translateErrors(
        exceptionResponse['message'],
        lang,
      );
      return response.status(status).json(translatedErrors);
    }

    return response.status(status).json(exceptionResponse);
  }

  private isValidationError(response: any): boolean {
    return Array.isArray(response);
  }

  private translateErrors(errors: any[], lang: string) {
    return errors.map((error) => ({
      property: error.field,
      errors: error.errors.map((translationKey: string) => {
        if (translationKey === 'forbiddenProperty') {
          return this.i18n.t(`dto.${translationKey}`, {
            lang,
            args: error.params,
          });
        }

        const [key, args] = translationKey.split('|');
        return this.i18n.t(`dto.${key}`, {
          lang,
          args: args ? JSON.parse(args) : {},
        });
      }),
    }));
  }
}
