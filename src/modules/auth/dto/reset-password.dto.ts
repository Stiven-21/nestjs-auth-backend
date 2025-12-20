import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
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
  @MinLength(8, {
    message: tm('validator.isMinLength', {
      min: 8,
    }),
  })
  @MaxLength(18, {
    message: tm('validator.isMaxLength', {
      max: 18,
    }),
  })
  @Matches(/(?=.*[a-z])/, {
    message: tm('validator.matches.lowercase'),
  })
  @Matches(/(?=.*[A-Z])/, {
    message: tm('validator.matches.uppercase'),
  })
  @Matches(/(?=.*\d)/, {
    message: tm('validator.matches.number'),
  })
  @Matches(/(?=.*[.,!@#$%^&*()_+\-=[\]{};':"\\|<>/?])/, {
    message: tm('validator.matches.spacial'),
  })
  password: string;

  @IsNotEmpty({
    message: tm('validator.isNotEmpty'),
  })
  @IsString({
    message: tm('validator.isString'),
  })
  @Transform(({ value }) => value.toString().trim())
  @MinLength(8, {
    message: tm('validator.isMinLength', {
      min: 8,
    }),
  })
  @MaxLength(18, {
    message: tm('validator.isMaxLength', {
      max: 18,
    }),
  })
  @Matches(/(?=.*[a-z])/, {
    message: tm('validator.matches.lowercase'),
  })
  @Matches(/(?=.*[A-Z])/, {
    message: tm('validator.matches.uppercase'),
  })
  @Matches(/(?=.*\d)/, {
    message: tm('validator.matches.number'),
  })
  @Matches(/(?=.*[.,!@#$%^&*()_+\-=[\]{};':"\\|<>/?])/, {
    message: tm('validator.matches.spacial'),
  })
  password_confirm: string;
}
