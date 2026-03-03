import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { tm } from 'src/common/helpers/i18n.helper';
import { UseSecurityRecoveryCodeDto } from 'src/modules/users/dto/use-security-recovery-code.dto';

export class TwoFactorAuthVerifyDto extends UseSecurityRecoveryCodeDto {
  @ApiProperty({
    example: 'asdf1234',
    description: 'Token temporal de autenticación de dos factores',
  })
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsString({ message: tm('validator.isString') })
  tempToken: string;
}
