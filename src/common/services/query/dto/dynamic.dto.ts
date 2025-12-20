import {
  IsOptional,
  IsString,
  IsNumberString,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { tm } from 'src/common/helpers/i18n.helper';

/**
 * DTO para manejar los parámetros de consulta dinámicos.
 * 'page' y 'limit' son obligatorios.
 */
export class DynamicQueryDto {
  // Los campos explícitos deben tener los decoradores de validación y transformación

  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsNumberString({}, { message: tm('validator.isNumber') })
  @Transform(({ value }) => value.trim())
  page: number;

  @IsNotEmpty({ message: tm('validator.isNotEmpty') })
  @IsNumberString({}, { message: tm('validator.isNumber') })
  @Transform(({ value }) => value.trim())
  limit: number;

  @IsOptional()
  @IsString({ message: tm('validator.isString') })
  @Transform(({ value }) => value.trim())
  sort?: string;

  // --- Manejo de Filtros Opcionales y Dinámicos ---

  /**
   * Captura y permite la asignación de cualquier otra propiedad que venga en la query
   * (ej: nombre, estado, relation.id), ya que van a ser nuestros filtros.
   * Esto funciona porque tienes 'whitelist: true' y 'forbidNonWhitelisted: true'
   * en tu pipe global, lo que normalmente bloquearía campos no declarados.
   * @Allow() actúa como una excepción para todos los demás campos.
   */

  [key: string]: string | number;
}
