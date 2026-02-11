import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { LanguageProvider } from 'src/providers/language.provider';
import {
  I18nModule as NestI18nModule,
  I18nJsonLoader,
  AcceptLanguageResolver,
  HeaderResolver,
} from 'nestjs-i18n';
import * as path from 'path';
import { DEFAULT_LANGUAGE } from 'src/common/constants/i18n.constants';
import { I18nMiddleware } from 'src/middlewares/i18n.middleware';

const isProd = process.env.NODE_ENV === 'production';
const isI18nEnabled = process.env.I18N_ENABLED === 'true';
const defaultLanguage = process.env.I18N_FALLBACK_LANGUAGE || 'en';

@Module({
  imports: [
    NestI18nModule.forRoot({
      fallbackLanguage: defaultLanguage || DEFAULT_LANGUAGE,
      loader: I18nJsonLoader,
      loaderOptions: {
        path: isProd
          ? path.join(process.cwd(), 'dist', 'i18n', 'locales')
          : path.join(process.cwd(), 'src', 'i18n', 'locales'),
        watch: !isProd,
      },
      typesOutputPath: isProd
        ? path.join(
            process.cwd(),
            'dist',
            'common',
            'generated',
            'i18n.generated.ts',
          )
        : path.join(
            process.cwd(),
            'src',
            'common',
            'generated',
            'i18n.generated.ts',
          ),
      resolvers: isI18nEnabled
        ? [
            { use: HeaderResolver, options: ['x-custom-lang'] },
            AcceptLanguageResolver,
          ]
        : [
            {
              use: HeaderResolver,
              options: ['x-force-lang'],
            },
          ],
    }),
  ],
  providers: [LanguageProvider],
})
export class I18nModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(I18nMiddleware)
      .forRoutes({ path: ':path', method: RequestMethod.ALL });
  }
}
