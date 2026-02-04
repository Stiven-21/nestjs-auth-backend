import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { tm } from 'src/common/helpers/i18n.helper';

export class ChangeRoleDto {
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsNumber({}, { message: tm('validator.isNumber') })
  @IsPositive({ message: tm('validator.isPositive') })
  roleId: number;
}
