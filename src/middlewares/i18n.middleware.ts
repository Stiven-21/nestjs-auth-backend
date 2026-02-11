import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  AppLanguage,
} from 'src/common/constants/i18n.constants';

@Injectable()
export class I18nMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    let lang: string | undefined = DEFAULT_LANGUAGE;

    if (req.query.lang && typeof req.query.lang === 'string')
      lang = req.query.lang;

    if (!lang && req.headers['accept-language']) {
      const headerLang = req.headers['accept-language']
        .split(',')[0]
        .split('-')[0];

      lang = headerLang;
    }

    if (!SUPPORTED_LANGUAGES.includes(lang as AppLanguage))
      lang = DEFAULT_LANGUAGE;

    req['language'] = lang;

    next();
  }
}
