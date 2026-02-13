import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { tm } from 'src/common/helpers/i18n.helper';
import { LocationInfo } from 'src/common/interfaces/location-info.interface';

export class CreateSessionDto {
  @ApiProperty({ example: 1, description: 'ID del usuario' })
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsNumber({}, { message: tm('validator.isNumber') })
  @IsPositive({ message: tm('validator.isPositive') })
  userId: number;

  @ApiProperty({ example: '127.0.0.1', description: 'IP del usuario' })
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsString({ message: tm('validator.isString') })
  ip: string;

  @ApiProperty({ example: 'Chrome', description: 'Dispositivo del usuario' })
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsString({ message: tm('validator.isString') })
  device: string;

  @ApiProperty({
    example: 'Chrome/80.0.3987.149',
    description: 'Navegador del usuario',
  })
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsString({ message: tm('validator.isString') })
  userAgent: string;

  @ApiProperty({
    example: { latitude: 0, longitude: 0 },
    description: 'Ubicación del usuario',
  })
  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  location: LocationInfo;
}
