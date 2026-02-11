import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { I18nMiddleware } from 'src/middlewares/i18n.middleware';
import { LanguageProvider } from 'src/providers/language.provider';
import {
  I18nModule as NestI18nModule,
  I18nJsonLoader,
  AcceptLanguageResolver,
  HeaderResolver,
} from 'nestjs-i18n';
import * as path from 'path';
import { DefaultLanguage } from 'src/common/types/languages.types';

const isProd = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    NestI18nModule.forRoot({
      fallbackLanguage: DefaultLanguage,
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
      resolvers: [
        { use: HeaderResolver, options: ['x-custom-lang'] },
        AcceptLanguageResolver,
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
