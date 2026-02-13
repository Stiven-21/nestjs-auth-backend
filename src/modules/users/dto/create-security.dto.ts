import { IsNotEmpty } from 'class-validator';
import { User } from 'src/modules/users/entities/user.entity';
import { tm } from 'src/common/helpers/i18n.helper';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSecurityDto {
  @ApiProperty({ type: User })
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  user: User;
}
