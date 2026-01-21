import { IsNotEmpty } from 'class-validator';
import { User } from '../entities/user.entity';

export class CreateSecurityDto {
  @IsNotEmpty()
  user: User;
}
