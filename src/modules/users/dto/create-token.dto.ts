import { IsEmail, IsNotEmpty } from 'class-validator';
import { User } from '../entities/user.entity';
import { tm } from 'src/common/helpers/i18n.helper';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTokenEmailVerificationDto {
  @ApiProperty({ type: User })
  @IsNotEmpty()
  user: User;
}

export class CreateTokenPasswordResetDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsEmail({}, { message: tm('validator.isEmail') })
  email: string;
}
