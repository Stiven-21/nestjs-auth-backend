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

export class CreateOAuthDto {
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsNumber({}, { message: tm('validator.isNumber') })
  @IsPositive({ message: tm('validator.isPositive') })
  userId: number;

  @IsEnum(OAuthProviderEnum, {
    message: tm('validator.isEnum', { enumValues: OAuthProviderEnum }),
  })
  provider: OAuthProviderEnum;

  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsString({ message: tm('validator.isString') })
  providerId: string;

  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsBoolean({ message: tm('validator.isBoolean') })
  isActive: boolean;

  @IsOptional()
  @IsString({ message: tm('validator.isString') })
  avatar?: string;
}
