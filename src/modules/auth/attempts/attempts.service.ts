import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext } from 'nestjs-i18n';
import { internalServerError } from 'src/common/exceptions';
import { AuthAttempts } from 'src/modules/auth/entities/auth-attempts.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AttemptsService {
  private readonly logger = new Logger(AttemptsService.name);
  constructor(
    @InjectRepository(AuthAttempts)
    private readonly authAttemptsRepository: Repository<AuthAttempts>,
  ) {}

  async findEmail(email: string, i18n: I18nContext) {
    try {
      return this.authAttemptsRepository.findOne({ where: { email } });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  async recordFailure(email: string, ipAddress: string, i18n: I18nContext) {
    let attempt: AuthAttempts | null = null;

    try {
      attempt = await this.findEmail(email, i18n);
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }

    if (!attempt) {
      try {
        attempt = this.authAttemptsRepository.create({
          email,
          ipAddress,
          attempts: 1,
        });
      } catch (error) {
        this.logger.error(error);
        internalServerError({ i18n, lang: i18n.lang });
      }
    } else {
      attempt.attempts += 1;
    }

    attempt.blockedUntil = await this.calculateBlock(attempt.attempts);
    try {
      await this.authAttemptsRepository.save(attempt);
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  async reset(email: string, i18n: I18nContext) {
    try {
      await this.authAttemptsRepository.delete({ email });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  private async calculateBlock(attempts: number) {
    const now = new Date();
    if (attempts >= 15) return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
    if (attempts >= 10) return new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes
    if (attempts >= 5) return new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
    return null;
  }
}
