import { IsNotEmpty, IsString } from 'class-validator';
import { tm } from 'src/common/helpers/i18n.helper';

export class UpdateTokenDto {
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsString({ message: tm('validator.isString') })
  token: string;
}
