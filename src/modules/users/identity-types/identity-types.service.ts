import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IdentityType } from 'src/modules/users/entities/identity-type.entity';
import { Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { internalServerError, okResponse } from 'src/common/exceptions';
import { ResponseFactory } from 'src/common/exceptions/response.factory';

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
        data: identityTypes,
        meta: { total },
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
      ResponseFactory.error({
        i18n,
        lang: i18n.lang,
        code: 'IDENTITY_TYPE_NOT_FOUND',
      });
    return okResponse({ data: identityType, meta: { total: 1 } });
  }
}
