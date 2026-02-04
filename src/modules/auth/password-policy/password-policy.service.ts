import { Injectable, Logger } from '@nestjs/common';
import { AuthPasswordPolicy } from 'src/modules/auth/entities/auth-password-policy.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PasswordPolicyService {
  private readonly logger = new Logger(PasswordPolicyService.name);

  constructor(
    @InjectRepository(AuthPasswordPolicy)
    private readonly passwordPolicyRepository: Repository<AuthPasswordPolicy>,
  ) {}

  async findOne(): Promise<AuthPasswordPolicy> {
    return await this.passwordPolicyRepository.findOne({
      where: { isActive: true },
    });
  }
}
