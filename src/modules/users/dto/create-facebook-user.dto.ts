import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { tm } from 'src/common/helpers/i18n.helper';

export class FacebookProfileDto extends PartialType(
  OmitType(CreateUserDto, ['documentTypeId', 'document']),
) {
  @ApiProperty({ example: '123456', description: 'Facebook id' })
  @IsNotEmpty({
    message: tm('validator.isNotEmpty'),
  })
  facebookId: string;

  @ApiProperty({ example: 'http://avatar.url', description: 'User avatar url' })
  @IsNotEmpty({
    message: tm('validator.isNotEmpty'),
  })
  @IsString({
    message: tm('validator.isString'),
  })
  @MaxLength(255, {
    message: tm('validator.isMaxLength', {
      max: 255,
    }),
  })
  avatar: string;
}
