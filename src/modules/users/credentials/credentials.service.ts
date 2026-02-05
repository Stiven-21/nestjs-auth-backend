import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserAccountCredentials } from 'src/modules/users/entities/user-account-credentials.entity';
import { EntityManager, Repository } from 'typeorm';
import { CreateCredentialsDto } from 'src/modules/users/dto/create-credentials.dto';
import { I18nContext } from 'nestjs-i18n';
import { UsersService } from 'src/modules/users/users.service';
import { badRequestError, internalServerError } from 'src/common/exceptions';
import * as bcrypt from 'bcryptjs';
import { UpdatePasswordDto } from 'src/modules/users/dto/update-user.dto';

@Injectable()
export class CredentialsService {
  private readonly logger = new Logger(CredentialsService.name);

  constructor(
    @InjectRepository(UserAccountCredentials)
    private readonly credentialsRepository: Repository<UserAccountCredentials>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  async create(
    createCredentialsDto: CreateCredentialsDto,
    i18n: I18nContext,
    manager?: EntityManager,
  ) {
    const repo = manager
      ? manager.getRepository(UserAccountCredentials)
      : this.credentialsRepository;
    const password_hash = await bcrypt.hash(createCredentialsDto.password, 10);

    const existCredentials = await this.credentialsRepository.findOne({
      where: { user: { id: createCredentialsDto.user.id } },
    });

    if (existCredentials)
      badRequestError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.auth.error.userHasCredentials', {
          lang: i18n.lang,
        }),
      });

    try {
      return await repo.save({
        user: createCredentialsDto.user,
        password: password_hash,
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  async updatePassword(
    email: string,
    updatePasswordDto: UpdatePasswordDto,
    i18n: I18nContext,
    manager?: EntityManager,
  ) {
    const repo = manager
      ? manager.getRepository(UserAccountCredentials)
      : this.credentialsRepository;

    let credential = await this.credentialsRepository.findOneBy({
      user: { email },
    });

    if (!credential) {
      const user = await this.usersService.__findOneByEmail(email, i18n);
      credential = await this.create(
        {
          user,
          password: updatePasswordDto.password,
        },
        i18n,
        manager,
      );
    }
    const { password, password_confirm } = updatePasswordDto;

    if (password !== password_confirm)
      return badRequestError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.auth.error.passwordsDoesNotMatch', {
          lang: i18n.lang,
        }),
      });
    const password_hash = await bcrypt.hash(password, 10);
    try {
      return await repo.update(credential.id, {
        password: password_hash,
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  async validateReathPassword(
    userId: number,
    password: string,
    i18n: I18nContext,
  ) {
    let credentials: UserAccountCredentials | null = null;
    try {
      credentials = await this.credentialsRepository.findOne({
        where: { user: { id: userId } },
        select: ['id', 'password'],
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }

    if (!credentials && password !== '') return false;
    if (!credentials && password === '') return true;

    const isMatch = await bcrypt.compare(password, credentials.password);
    if (!isMatch) return false;
    return true;
  }
}
