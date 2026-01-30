import { IsNotEmpty } from 'class-validator';
import { tm } from 'src/common/helpers/i18n.helper';
import { AuthSessions } from '../entities/auth-sessions.entity';

export class CreateAuthRefreshTokenDto {
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  refreshToken: string;

  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  authSession: AuthSessions;
}
