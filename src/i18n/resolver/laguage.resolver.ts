import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nResolver } from 'nestjs-i18n';
import { DEFAULT_LANGUAGE } from 'src/common/constants/i18n.constants';

@Injectable()
export class LanguageResolver implements I18nResolver {
  private readonly logger = new Logger(LanguageResolver.name);
  constructor(private readonly configService: ConfigService) {}

  resolve(
    context: ExecutionContext,
  ): Promise<string | string[] | undefined> | string | string[] | undefined {
    const isEneable = this.configService.get('I18N_ENABLED') === 'true';

    if (!isEneable) {
      const defaultLang =
        this.configService.get('I18N_FALLBACK_LANGUAGE') || DEFAULT_LANGUAGE;

      const request = context.switchToHttp().getRequest();
      request.headers['accept-language'] = defaultLang;
      request.headers['x-lang'] = defaultLang;
      request.headers['x-custom-lang'] = defaultLang;
      return defaultLang;
    }

    return undefined;
  }
}
