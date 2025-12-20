import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IdentityType } from 'src/modules/users/entities/identity-type.entity';
import { Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import {
  internalServerError,
  notFoundError,
  okResponse,
} from 'src/common/exceptions';

@Injectable()
export class IdentityTypesService {
  private readonly logger = new Logger(IdentityTypesService.name);
  constructor(
    @InjectRepository(IdentityType)
    private readonly identityTypesRepository: Repository<IdentityType>,
  ) {}

  async findAll(i18n: I18nContext) {
    const lang = i18n.lang;
    try {
      const [identityTypes, total] =
        await this.identityTypesRepository.findAndCount();
      return okResponse({
        i18n,
        lang,
        data: {
          data: identityTypes,
          total,
        },
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang });
    }
  }

  async findOne(id: number, i18n: I18nContext) {
    let identityType: IdentityType | null = null;

    try {
      identityType = await this.identityTypesRepository.findOneBy({ id });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
    if (!identityType)
      notFoundError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.common.notFound', {
          lang: i18n.lang,
          args: { entity: i18n.t('entities.identityType.singular') },
        }),
      });
    return okResponse({ i18n, lang: i18n.lang, data: identityType });
  }
}
