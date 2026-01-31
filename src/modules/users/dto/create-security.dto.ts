import { IsNotEmpty } from 'class-validator';
import { User } from '../entities/user.entity';
import { tm } from 'src/common/helpers/i18n.helper';

export class CreateSecurityDto {
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  user: User;
}
