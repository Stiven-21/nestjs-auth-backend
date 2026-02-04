import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { AuditEvent } from 'src/common/enum/audit-event.enum';
import { tm } from 'src/common/helpers/i18n.helper';

export class CreateAuditLogDto {
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsEnum({ message: tm('validator.isEnum', { enumValues: AuditEvent }) })
  event: AuditEvent;

  @IsOptional()
  actorId?: number;

  @IsOptional()
  targetId?: number;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  ip?: string;

  @IsOptional()
  userAgent?: string;
}
