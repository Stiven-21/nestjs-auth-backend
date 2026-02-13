import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { AuditEvent } from 'src/common/enum/audit-event.enum';
import { tm } from 'src/common/helpers/i18n.helper';

export class CreateAuditLogDto {
  @ApiProperty({ example: AuditEvent.LOGIN_FAILED, description: 'Audit event' })
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsEnum({ message: tm('validator.isEnum', { enumValues: AuditEvent }) })
  event: AuditEvent;

  @ApiProperty({ example: 1, description: 'ID del actor' })
  @IsOptional()
  actorId?: number;

  @ApiProperty({ example: 1, description: 'ID del objetivo' })
  @IsOptional()
  targetId?: number;

  @ApiProperty({ example: { key: 'value' }, description: 'Metadata adicional' })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ example: '127.0.0.1', description: 'IP del usuario' })
  @IsOptional()
  ip?: string;

  @ApiProperty({
    example: 'Mozilla/5.0',
    description: 'User agent del usuario',
  })
  @IsOptional()
  userAgent?: string;
}
