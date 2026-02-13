import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { tm } from 'src/common/helpers/i18n.helper';

export class UseSecurityRecoveryCodeDto {
  @ApiProperty({ example: '123456', description: 'Código de recuperación' })
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsString({ message: tm('validator.isString') })
  code: string;
}
