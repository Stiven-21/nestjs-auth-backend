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
        where: {
          deviceId: createAuthSessionDto.deviceId,
          user: {
            id: createAuthSessionDto.user.id,
          },
        },
      });
      if (authSession && authSession.isActive === false) {
        await this.updateActive(authSession.id, true, i18n);
        return authSession;
      }
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

  async updateActive(
    id: number,
    isActive: boolean,
    i18n: I18nContext,
    manager?: EntityManager,
  ) {
    const repo = manager
      ? manager.getRepository(AuthSessions)
      : this.authSessionsRepository;
    try {
      return await repo.update(id, { isActive });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  async updateInactiveUserId(
    userId: number,
    i18n: I18nContext,
    manager?: EntityManager,
  ) {
    const repo = manager
      ? manager.getRepository(AuthSessions)
      : this.authSessionsRepository;
    try {
      const sessions = await repo.find({
        where: {
          isActive: true,
          user: {
            id: userId,
          },
        },
      });

      if (!sessions.length) return;
      sessions.forEach((session) => {
        session.isActive = false;
      });

      await repo.save(sessions);
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  async findBySessionId(sessionId: number, i18n: I18nContext) {
    try {
      return await this.authSessionsRepository.findOne({
        where: { id: sessionId, isActive: true },
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  async findByDeviceId(deviceId: string, i18n: I18nContext) {
    try {
      return await this.authSessionsRepository.findOneBy({ deviceId });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }
}
