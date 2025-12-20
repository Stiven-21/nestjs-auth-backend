import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Repository } from 'typeorm';
import {
  internalServerError,
  notFoundError,
  okResponse,
} from 'src/common/exceptions';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async findAll(i18n: I18nContext) {
    try {
      const [roles, total] = await this.rolesRepository.findAndCount();
      return okResponse({
        i18n,
        lang: i18n.lang,
        data: { data: roles, total },
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  async findOne(id: number, i18n: I18nContext) {
    let role: Role | null;
    try {
      role = await this.rolesRepository.findOneBy({ id });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
    if (!role)
      notFoundError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.common.notFound', {
          lang: i18n.lang,
          args: { entity: i18n.t('entities.role.singular') },
        }),
      });
    return okResponse({ i18n, lang: i18n.lang, data: role });
  }
}
