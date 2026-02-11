import { Injectable, Logger } from '@nestjs/common';
import { CreateAuditLogDto } from 'src/modules/audit-log/dto/create-audit-log.dto';
import { I18nContext } from 'nestjs-i18n';
import { internalServerError, okResponse } from 'src/common/exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLog } from 'src/modules/audit-log/entities/audit-log.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async create(createAuditLogDto: CreateAuditLogDto, i18n: I18nContext) {
    try {
      await this.auditLogRepository.save(createAuditLogDto);
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  async findOne(userId: number, i18n: I18nContext) {
    try {
      const [auditLogs, total] = await this.auditLogRepository.findAndCount({
        where: { actorId: userId },
      });
      return okResponse({ data: auditLogs, meta: { total } });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }
}
