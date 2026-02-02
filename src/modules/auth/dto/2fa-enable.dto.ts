import { IsNotEmpty } from 'class-validator';
import { TwoFactorType } from 'src/common/enum/two-factor-type.enum';
import { tm } from 'src/common/helpers/i18n.helper';

export class TwoFactorEnableDto {
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  twoFactorType: TwoFactorType;
}
