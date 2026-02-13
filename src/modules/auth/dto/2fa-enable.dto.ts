import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { TwoFactorType } from 'src/common/enum/two-factor-type.enum';
import { tm } from 'src/common/helpers/i18n.helper';

export class TwoFactorEnableDto {
  @ApiProperty({ example: TwoFactorType.TOTP, description: 'Two factor type' })
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  twoFactorType: TwoFactorType;
}
