import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
export class ReAuthDto {
  @ApiProperty({ example: '123456', description: 'Password' })
  @IsOptional()
  password: string;
}
