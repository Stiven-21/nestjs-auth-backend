import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext } from 'nestjs-i18n';
import { UserEmailChangeLog } from 'src/modules/users/entities/user-email-change-log.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { UsersService } from 'src/modules/users/users.service';
import { v7 as uuidv7 } from 'uuid';
import { badRequestError, internalServerError } from 'src/common/exceptions';
import { User } from 'src/modules/users/entities/user.entity';

@Injectable()
export class EmailLogChangesService {
  private readonly logger = new Logger(EmailLogChangesService.name);

  constructor(
    @InjectRepository(UserEmailChangeLog)
    private readonly emailChangeRepository: Repository<UserEmailChangeLog>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  async changeEmail(
    id: number,
    oldEmail: string,
    newEmail: string,
    i18n: I18nContext,
    manager?: EntityManager,
  ) {
    const repo = manager
      ? manager.getRepository(UserEmailChangeLog)
      : this.emailChangeRepository;

    const user = (await this.usersService.findOne(id, i18n)).data.data;

    const token = uuidv7();

    try {
      return await repo.save({
        user,
        oldEmail,
        newEmail,
        rollbackToken: token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  async rollbackEmail(token: string, i18n: I18nContext) {
    const log = await this.emailChangeRepository.findOne({
      where: { rollbackToken: token },
      relations: ['user'],
    });

    if (!log || log.revoked) badRequestError({ i18n, lang: i18n.lang });

    if (log.expiresAt < new Date()) badRequestError({ i18n, lang: i18n.lang });

    log.user.email = log.oldEmail;
    log.revoked = true;

    try {
      await this.dataSource.manager.transaction(async (manager) => {
        await manager.getRepository(UserEmailChangeLog).save(log);
        await manager.getRepository(User).save(log.user);
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }
}
