import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsValidPassword } from 'src/common/decorators/isValidPassword.decorator';
import { tm } from 'src/common/helpers/i18n.helper';

export class CreateUserDto {
  @ApiProperty({ example: 'John', description: 'Nombre del usuario' })
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

  @ApiProperty({ example: 'Doe', description: 'Apellido del usuario' })
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

  @ApiProperty({
    example: 1,
    description: 'ID del tipo de documento (Cédula, Pasaporte, etc.)',
  })
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

  @ApiProperty({ example: '1234567890', description: 'Número de documento' })
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

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Correo electrónico único',
  })
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

  @ApiProperty({
    example: 'P@ssw0rd123!',
    description: 'Contraseña segura del usuario',
  })
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
