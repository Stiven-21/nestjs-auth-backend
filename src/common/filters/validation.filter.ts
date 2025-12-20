import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Response } from 'express';
import { DefaultLanguage } from 'src/common/types/languages.types';

@Catch(BadRequestException)
export class ValidationFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

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
      DefaultLanguage;

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
