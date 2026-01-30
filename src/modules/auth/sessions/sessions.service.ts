import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthSessions } from 'src/modules/auth/entities/auth-sessions.entity';
import { EntityManager, Repository } from 'typeorm';
import { CreateAuthSessionDto } from '../dto/create-auth-session.dto';
import { I18nContext } from 'nestjs-i18n';
import { internalServerError } from 'src/common/exceptions';

@Injectable()
export class AuthSessionsService {
  private readonly logger = new Logger(AuthSessionsService.name);
  constructor(
    @InjectRepository(AuthSessions)
    private readonly authSessionsRepository: Repository<AuthSessions>,
  ) {}

  async createAuthSession(
    createAuthSessionDto: CreateAuthSessionDto,
    i18n: I18nContext,
    manager?: EntityManager,
  ) {
    try {
      const authSession = await this.authSessionsRepository.findOne({
        where: { deviceId: createAuthSessionDto.deviceId },
      });
      if (authSession) return authSession;
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }

    const repo = manager
      ? manager.getRepository(AuthSessions)
      : this.authSessionsRepository;
    try {
      return await repo.save({
        ...createAuthSessionDto,
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // expires in 2 days
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }
}
