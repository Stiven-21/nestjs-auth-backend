import { IsEmail, IsNotEmpty } from 'class-validator';
import { User } from '../entities/user.entity';
import { tm } from 'src/common/helpers/i18n.helper';

export class CreateTokenEmailVerificationDto {
  @IsNotEmpty()
  user: User;
}

export class CreateTokenPasswordResetDto {
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsEmail({}, { message: tm('validator.isEmail') })
  email: string;
}
