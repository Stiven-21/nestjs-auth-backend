import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/modules/roles/entities/role.entity';
import { Repository } from 'typeorm';
import {
  internalServerError,
  notFoundError,
  okResponse,
} from 'src/common/exceptions';
import { I18nContext } from 'nestjs-i18n';
import { normalizePermissions } from 'src/common/utils/normalize-permissions.utils';

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

  async getNameRoleOrCreate(rol: string, i18n: I18nContext) {
    let role: Role | null = null;
    try {
      role = await this.rolesRepository.findOneBy({ name: rol });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }

    if (!role) {
      try {
        const permissions = await normalizePermissions(
          process.env.ROL_PERMISSION_DEFAULT,
        );
        role = await this.rolesRepository.save({ name: rol, permissions });
      } catch (error) {
        this.logger.error(error);
        internalServerError({ i18n, lang: i18n.lang });
      }
    }

    return role;
  }
}
