import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { LanguageProvider } from 'src/i18n/providers/language.provider';
import {
  I18nModule as NestI18nModule,
  I18nJsonLoader,
  AcceptLanguageResolver,
  HeaderResolver,
  QueryResolver,
} from 'nestjs-i18n';
import * as path from 'path';
import { DEFAULT_LANGUAGE } from 'src/common/constants/i18n.constants';
import { I18nMiddleware } from 'src/i18n/middlewares/i18n.middleware';
import { ConfigService } from '@nestjs/config';
import { LanguageResolver } from 'src/i18n/resolver/laguage.resolver';

@Module({
  imports: [
    NestI18nModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        fallbackLanguage:
          configService.get('I18N_FALLBACK_LANGUAGE') || DEFAULT_LANGUAGE,
        loader: I18nJsonLoader,
        loaderOptions: {
          path:
            configService.get('NODE_ENV') === 'production'
              ? path.join(process.cwd(), 'dist', 'i18n', 'locales')
              : path.join(process.cwd(), 'src', 'i18n', 'locales'),
          watch: !(configService.get('NODE_ENV') === 'production'),
        },
        typesOutputPath:
          configService.get('NODE_ENV') === 'production'
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
      }),
      resolvers: [
        LanguageResolver,
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
        new HeaderResolver(['x-custom-lang']),
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
