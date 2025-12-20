import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { tm } from 'src/common/helpers/i18n.helper';

export class LoginDto {
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsEmail({}, { message: tm('validator.isEmail') })
  @Transform(({ value }) => value.toString().trim().toLowerCase())
  email: string;

  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @Transform(({ value }) => value.toString().trim())
  password: string;
}
