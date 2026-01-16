import { PickType } from '@nestjs/swagger';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';
import { IsNotEmpty } from 'class-validator';
import { User } from 'src/modules/users/entities/user.entity';

export class CreateCredentialsDto extends PickType(CreateUserDto, [
  'password',
]) {
  @IsNotEmpty()
  user: User;
}
