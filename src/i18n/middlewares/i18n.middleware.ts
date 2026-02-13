import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  AppLanguage,
} from 'src/common/constants/i18n.constants';

@Injectable()
export class I18nMiddleware implements NestMiddleware {
  private readonly logger = new Logger(I18nMiddleware.name);

  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    let lang: string | undefined =
      this.configService.get('I18N_FALLBACK_LANGUAGE') || DEFAULT_LANGUAGE;

    const isEnabled = this.configService.get('I18N_ENABLED') === 'true';
    if (isEnabled) {
      if (req.query.lang && typeof req.query.lang === 'string')
        lang = req.query.lang;

      if (
        !lang &&
        req.headers['accept-language'] &&
        req.acceptsLanguages(SUPPORTED_LANGUAGES)
      ) {
        const headerLang = req.headers['accept-language']
          .split(',')[0]
          .split('-')[0];

        lang = headerLang;
      }

      if (!SUPPORTED_LANGUAGES.includes(lang as AppLanguage))
        lang = DEFAULT_LANGUAGE;
    }

    req['language'] = lang;

    next();
  }
}
