import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';
import { ResetPasswordTokenDto } from 'src/modules/auth/dto/reset-password.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {}

export class UpdatePasswordDto extends ResetPasswordTokenDto {}
