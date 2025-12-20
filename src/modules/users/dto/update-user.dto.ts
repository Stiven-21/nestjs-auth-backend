import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { ResetPasswordTokenDto } from 'src/modules/auth/dto/reset-password.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UpdatePasswordDto extends ResetPasswordTokenDto {}
