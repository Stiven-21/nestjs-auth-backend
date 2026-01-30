import { IsNotEmpty } from 'class-validator';
import { tm } from 'src/common/helpers/i18n.helper';
import { User } from 'src/modules/users/entities/user.entity';

export class CreateAuthSessionDto {
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  user: User;

  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  userAgent: string;

  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  ipAddress: string;

  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  deviceId: string;
}
