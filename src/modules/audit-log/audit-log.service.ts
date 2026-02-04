import { Injectable, Logger } from '@nestjs/common';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { UpdateAuditLogDto } from './dto/update-audit-log.dto';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);
  create(createAuditLogDto: CreateAuditLogDto) {
    this.logger.debug(createAuditLogDto);
    return 'This action adds a new auditLog';
  }

  findAll() {
    return `This action returns all auditLog`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auditLog`;
  }

  update(id: number, updateAuditLogDto: UpdateAuditLogDto) {
    this.logger.debug(updateAuditLogDto);
    return `This action updates a #${id} auditLog`;
  }

  remove(id: number) {
    return `This action removes a #${id} auditLog`;
  }
}
