import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { tm } from 'src/common/helpers/i18n.helper';
import { User } from 'src/modules/users/entities/user.entity';

export class CreateAuthSessionDto {
  @ApiProperty({ type: User })
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  user: User;

  @ApiProperty({ example: 'Chrome/80.0.3987.149', description: 'User agent' })
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  userAgent: string;

  @ApiProperty({ example: '127.0.0.1', description: 'IP address' })
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  ipAddress: string;

  @ApiProperty({ example: '123456', description: 'Device id' })
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  deviceId: string;
}
