import { I18nContext } from 'nestjs-i18n';
import { HttpStatus } from '@nestjs/common';

/**
 * Base interface used for both success and error responses.
 */
export interface BaseResponse {
  i18n: I18nContext; // contexto de traducción
  lang: string; // idioma a usar
  code: HttpStatus | number; // código HTTP (ex: 200, 404, 500)
  args?: Record<string, any>; // parámetros dinámicos para i18n
  description?: string; // descripción opcional personalizada
}

/**
 * Interface for success responses (200, 201, etc.)
 */
// extends Omit<BaseResponse, 'args'>
export interface SuccessResponseOptions extends BaseResponse {
  data: any; // la data siempre existe en respuestas OK
}

/**
 * Interface for error responses
 * (NotFound, Conflict, InternalError, etc.)
 */
export interface ErrorResponseOptions extends BaseResponse {
  data?: never; // un error nunca devuelve "data"
}
