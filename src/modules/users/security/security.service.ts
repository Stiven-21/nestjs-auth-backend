import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserSecurity } from '../entities/user-security.entity';
import { EntityManager, Repository } from 'typeorm';
import { CreateSecurityDto } from '../dto/create-security.dto';
import { I18nContext } from 'nestjs-i18n';
import { internalServerError } from 'src/common/exceptions';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(
    @InjectRepository(UserSecurity)
    private readonly securityRepository: Repository<UserSecurity>,
  ) {}

  async create(
    createSecurityDto: CreateSecurityDto,
    i18nContext?: I18nContext,
    manager?: EntityManager,
  ) {
    const repo = manager
      ? manager.getRepository(UserSecurity)
      : this.securityRepository;
    const i18n = i18nContext || I18nContext.current();

    const security = await this.securityRepository.findOne({
      where: { user: { id: createSecurityDto.user.id } },
    });
    if (security) return;

    try {
      return await repo.save(createSecurityDto);
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }
}
