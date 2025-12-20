import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { tm } from 'src/common/helpers/i18n.helper';

export class CreateSessionDto {
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsNumber({}, { message: tm('validator.isNumber') })
  @IsPositive({ message: tm('validator.isPositive') })
  userId: number;

  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsString({ message: tm('validator.isString') })
  ip: string;

  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsString({ message: tm('validator.isString') })
  device: string;

  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsString({ message: tm('validator.isString') })
  userAgent: string;

  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsString({ message: tm('validator.isString') })
  location: string;
}
