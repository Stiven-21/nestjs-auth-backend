import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { tm } from 'src/common/helpers/i18n.helper';
import { UseSecurityRecoveryCodeDto } from 'src/modules/users/dto/use-security-recovery-code.dto';

export class TwoFactorAuthVerifyDto extends UseSecurityRecoveryCodeDto {
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsNumber({}, { message: tm('validator.isNumber') })
  @IsPositive({ message: tm('validator.isPositive') })
  userId: number;
}
