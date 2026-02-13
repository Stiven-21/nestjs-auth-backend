import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { tm } from 'src/common/helpers/i18n.helper';

export class ChangeRoleDto {
  @ApiProperty({ example: 1, description: 'ID del rol' })
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsNumber({}, { message: tm('validator.isNumber') })
  @IsPositive({ message: tm('validator.isPositive') })
  roleId: number;
}
