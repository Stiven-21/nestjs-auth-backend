import { IsNotEmpty } from 'class-validator';
import { tm } from 'src/common/helpers/i18n.helper';
import { AuthSessions } from '../entities/auth-sessions.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAuthRefreshTokenDto {
  @ApiProperty({ example: '123456', description: 'Refresh token' })
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  refreshToken: string;

  @ApiProperty({
    type: AuthSessions,
    description: 'Auth session associated with the refresh token',
  })
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  authSession: AuthSessions;
}
