import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { tm } from 'src/common/helpers/i18n.helper';

export class UpdateTokenDto {
  @ApiProperty({ example: '123456', description: 'Token' })
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsString({ message: tm('validator.isString') })
  token: string;
}
