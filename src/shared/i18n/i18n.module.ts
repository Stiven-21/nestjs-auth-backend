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

@Module({
  imports: [
    NestI18nModule.forRoot({
      fallbackLanguage: DefaultLanguage,
      // formatter: (template: string, ...arg: any) => template,
      loader: I18nJsonLoader,
      loaderOptions: {
        path: path.join(process.cwd(), 'src', 'i18n', 'locales'),
        watch: true,
      },
      typesOutputPath: path.join(
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
