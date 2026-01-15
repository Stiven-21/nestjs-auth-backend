import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { tm } from 'src/common/helpers/i18n.helper';

export class GoogleProfileDto extends PartialType(
  OmitType(CreateUserDto, ['documentTypeId', 'document']),
) {
  @IsNotEmpty({
    message: tm('validator.isNotEmpty'),
  })
  googleId: string;

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
