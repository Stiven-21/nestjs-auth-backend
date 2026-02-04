import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { IsValidPassword } from 'src/common/decorators/isValidPassword.decorator';
import { tm } from 'src/common/helpers/i18n.helper';

export class ResetPasswordDto {
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsEmail({}, { message: tm('validator.isEmail') })
  email: string;
}

export class ResetPasswordTokenDto {
  @IsNotEmpty({
    message: tm('validator.isNotEmpty'),
  })
  @IsString({
    message: tm('validator.isString'),
  })
  @Transform(({ value }) => value.toString().trim())
  @IsValidPassword({
    message: tm('validator.isValidPassword'),
  })
  password: string;

  @IsNotEmpty({
    message: tm('validator.isNotEmpty'),
  })
  @IsString({
    message: tm('validator.isString'),
  })
  @Transform(({ value }) => value.toString().trim())
  @IsValidPassword({
    message: tm('validator.isValidPassword'),
  })
  password_confirm: string;
}
