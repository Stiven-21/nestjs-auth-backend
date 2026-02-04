import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { IsValidPassword } from 'src/common/decorators/isValidPassword.decorator';
import { tm } from 'src/common/helpers/i18n.helper';

export class CreateUserDto {
  @IsNotEmpty({
    message: tm('validator.isNotEmpty'),
  })
  @IsString({
    message: tm('validator.isString'),
  })
  @MaxLength(20, {
    message: tm('validator.isMaxLength', {
      max: 20,
    }),
  })
  name: string;

  @IsNotEmpty({
    message: tm('validator.isNotEmpty'),
  })
  @IsString({
    message: tm('validator.isString'),
  })
  @MaxLength(20, {
    message: tm('validator.isMaxLength', {
      max: 20,
    }),
  })
  lastname: string;

  @IsNotEmpty({
    message: tm('validator.isNotEmpty'),
  })
  @IsNumber(undefined, {
    message: tm('validator.isNumber'),
  })
  @IsPositive({
    message: tm('validator.isPositive'),
  })
  documentTypeId: number;

  @IsNotEmpty({
    message: tm('validator.isNotEmpty'),
  })
  @IsString({
    message: tm('validator.isString'),
  })
  @MaxLength(20, {
    message: tm('validator.isMaxLength', {
      max: 20,
    }),
  })
  document: string;

  @IsNotEmpty({
    message: tm('validator.isNotEmpty'),
  })
  @IsString({
    message: tm('validator.isString'),
  })
  @MaxLength(100, {
    message: tm('validator.isMaxLength', {
      max: 100,
    }),
  })
  @Transform(({ value }) => value.toString().toLowerCase().trim())
  email: string;

  @IsNotEmpty({
    message: tm('validator.isNotEmpty'),
  })
  @IsString({
    message: tm('validator.isString'),
  })
  @Transform(({ value }) => value.toString().trim())
  @IsValidPassword({ message: tm('validator.isPassword') })
  password: string;
}
