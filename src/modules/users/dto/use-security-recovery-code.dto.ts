import { IsNotEmpty, IsString } from 'class-validator';
import { tm } from 'src/common/helpers/i18n.helper';

export class UseSecurityRecoveryCodeDto {
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsString({ message: tm('validator.isString') })
  code: string;
}
