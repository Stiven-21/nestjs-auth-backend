import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserSession } from 'src/modules/users/entities/user-session.entity';
import { EntityManager, Repository } from 'typeorm';
import { UsersService } from 'src/modules/users/users.service';
import { CreateSessionDto } from 'src/modules/users/dto/create-session.dto';
import { I18nContext } from 'nestjs-i18n';
import {
  internalServerError,
  noContentResponse,
  okResponse,
} from 'src/common/exceptions';
import { DynamicQueryService } from 'src/common/services/query/dynamic.service';
import { DynamicQueryDto } from 'src/common/services/query/dto/dynamic.dto';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  constructor(
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
    private readonly usersService: UsersService,
    private readonly dynamicQueryService: DynamicQueryService,
  ) {}

  async create(
    createSessionDto: CreateSessionDto,
    i18n: I18nContext,
    manager?: EntityManager,
  ) {
    const repo = manager
      ? manager.getRepository(UserSession)
      : this.sessionRepository;
    const { userId, ...rest } = createSessionDto;
    const { data: user } = await this.usersService.findOne(userId, i18n);
    try {
      await repo.save({
        user,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        ...rest,
      });
      return noContentResponse();
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  async findByUserId(query: DynamicQueryDto, id: number, i18n: I18nContext) {
    await this.usersService.findOne(id, i18n);
    const { page, limit, sort, ...filters } = query;
    filters['user.id'] = Number(id);

    const { data: sessions, total } =
      await this.dynamicQueryService.findAndCount(
        this.sessionRepository,
        filters,
        page,
        limit,
        i18n,
        sort,
      );
    return okResponse({
      data: sessions,
      meta: { total },
    });
  }
}
