import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { OAuthProviderEnum } from 'src/common/enum/user-oauth-providers.enum';
import { tm } from 'src/common/helpers/i18n.helper';
import { User } from 'src/modules/users/entities/user.entity';

export class CreateOAuthDto {
  @ApiProperty({ type: User })
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsNumber({}, { message: tm('validator.isNumber') })
  @IsPositive({ message: tm('validator.isPositive') })
  user: User;

  @ApiProperty({ example: 'google', description: 'Oauth provider' })
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsEnum(OAuthProviderEnum, {
    message: tm('validator.isEnum', { enumValues: OAuthProviderEnum }),
  })
  provider: OAuthProviderEnum;

  @ApiProperty({ example: '123456', description: 'Oauth provider id' })
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsString({ message: tm('validator.isString') })
  providerId: string;

  @ApiProperty({ example: true, description: 'Is active oauth connection' })
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsBoolean({ message: tm('validator.isBoolean') })
  isActive: boolean;

  @ApiProperty({
    example: 'http://avatar.url',
    description: 'User avatar url',
    required: false,
  })
  @IsOptional()
  @IsString({ message: tm('validator.isString') })
  avatar?: string;
}
