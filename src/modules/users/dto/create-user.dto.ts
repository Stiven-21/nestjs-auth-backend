import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
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

  // @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  // @IsNumber(undefined, { message: tm('validator.isNumber') })
  // @IsPositive({ message: tm('validator.isPositive') })
  // roleId: number;
}
