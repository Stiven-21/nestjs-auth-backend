import { IsOptional } from 'class-validator';
export class ReAuthDto {
  @IsOptional()
  password: string;
}
