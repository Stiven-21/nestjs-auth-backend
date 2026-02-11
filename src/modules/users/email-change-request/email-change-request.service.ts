import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hashValue } from 'src/common/utils/hash.utils';
import { UserEmailChangeRequest } from 'src/modules/users/entities/user-email-change-request.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { User } from 'src/modules/users/entities/user.entity';
import { I18nContext } from 'nestjs-i18n';
import { internalServerError, noContentResponse } from 'src/common/exceptions';
import { MailService } from 'src/mails/mail.service';
import { EmailLogChangesService } from 'src/modules/users/email-log-changes/email-log-changes.service';
import { UsersService } from 'src/modules/users/users.service';
import { ResponseFactory } from 'src/common/exceptions/response.factory';

@Injectable()
export class EmailChangeRequestService {
  private readonly logger = new Logger(EmailChangeRequestService.name);

  constructor(
    @InjectRepository(UserEmailChangeRequest)
    private readonly emailChangeRepository: Repository<UserEmailChangeRequest>,
    @Inject(forwardRef(() => EmailLogChangesService))
    private readonly emailLogChangesService: EmailLogChangesService,
    private readonly mailService: MailService,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  async create(
    user: User,
    oldEmail: string,
    newEmail: string,
    i18n: I18nContext,
    manager?: EntityManager,
  ) {
    const repo = manager
      ? manager.getRepository(UserEmailChangeRequest)
      : this.emailChangeRepository;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // 1 day

    const token = uuidv7();
    const tokenHash = hashValue(token);
    try {
      const emailChange = await repo.save({
        user,
        oldEmail,
        newEmail,
        tokenHash,
        expiresAt,
      });

      const authorizationUrl = `${process.env.URL_FRONTEND}/email-change-request/verify/${token}`;

      await this.mailService.sendMail(
        oldEmail,
        'Solicitud de cambio de correo', // Subject o asunto
        'user-change-email-request', // Plantilla o template
        {
          oldEmail,
          newEmail,
          authorizationUrl,
        },
        i18n,
      );

      return emailChange;
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  async changeEmail(token: string, i18n: I18nContext) {
    const valid = await this.emailChangeRepository.findOne({
      where: { tokenHash: hashValue(token) },
      select: ['id', 'user', 'oldEmail', 'newEmail', 'expiresAt', 'used'],
    });

    if (!valid)
      ResponseFactory.error({ i18n, lang: i18n.lang, code: 'TOKEN_NOT_FOUND' });
    if (valid.expiresAt < new Date() || valid.used)
      ResponseFactory.error({ i18n, lang: i18n.lang, code: 'TOKEN_EXPIRED' });

    const rollbackToken = await this.dataSource.manager.transaction(
      async (manager) => {
        const log = await this.emailLogChangesService.changeEmail(
          valid.user.id,
          valid.oldEmail,
          valid.newEmail,
          i18n,
          manager,
        );
        await this.usersService.updateEmail(
          valid.user.id,
          valid.newEmail,
          i18n,
          manager,
        );
        valid.used = true;
        await manager.getRepository(UserEmailChangeRequest).save(valid);
        return log.rollbackToken;
      },
    );

    const revertLink = `${process.env.FRONTEND_URL}${process.env.PATH_CHANGE_EMAIL ?? '/email-change-request/rollback/'}${rollbackToken}`;

    await this.mailService.sendMail(
      valid.oldEmail,
      'Cambio de correo electrónico',
      'auth-email-update',
      {
        oldEmail: valid.oldEmail,
        newEmail: valid.newEmail,
        revertLink,
      },
      i18n,
    );

    return noContentResponse();
  }
}
