import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { I18nService } from 'nestjs-i18n';
import { Languages } from 'src/common/types/languages.types';

@Injectable()
export class I18nMiddleware implements NestMiddleware {
  constructor(private readonly i18n: I18nService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const language =
      req.headers['x-custom-lang'] || req.acceptsLanguages(Languages) || 'en';
    req['language'] = language;
    next();
  }
}
