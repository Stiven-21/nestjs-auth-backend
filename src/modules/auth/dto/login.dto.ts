import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { tm } from 'src/common/helpers/i18n.helper';

export class LoginDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Correo electrónico del usuario',
  })
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsEmail({}, { message: tm('validator.isEmail') })
  @Transform(({ value }) => value.toString().trim().toLowerCase())
  email: string;

  @ApiProperty({
    example: 'P@ssw0rd123!',
    description: 'Contraseña del usuario',
  })
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @Transform(({ value }) => value.toString().trim())
  password: string;
}
