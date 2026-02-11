import { Injectable, Logger } from '@nestjs/common';
import { AuthPasswordPolicy } from 'src/modules/auth/entities/auth-password-policy.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext } from 'nestjs-i18n';
import { internalServerError } from 'src/common/exceptions';

@Injectable()
export class PasswordPolicyService {
  private readonly logger = new Logger(PasswordPolicyService.name);

  constructor(
    @InjectRepository(AuthPasswordPolicy)
    private readonly passwordPolicyRepository: Repository<AuthPasswordPolicy>,
  ) {}

  async findOne(): Promise<AuthPasswordPolicy> {
    const i18n = I18nContext.current();
    try {
      return await this.passwordPolicyRepository.findOne({
        where: { isActive: true },
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }
}
