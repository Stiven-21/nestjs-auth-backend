import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { tm } from 'src/common/helpers/i18n.helper';
import { UseSecurityRecoveryCodeDto } from 'src/modules/users/dto/use-security-recovery-code.dto';

export class TwoFactorAuthVerifyDto extends UseSecurityRecoveryCodeDto {
  @ApiProperty({
    example: 1,
    description: 'ID del usuario para verificación 2FA',
  })
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsNumber({}, { message: tm('validator.isNumber') })
  @IsPositive({ message: tm('validator.isPositive') })
  userId: number;
}
