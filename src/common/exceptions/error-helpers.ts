import { HttpStatus } from '@nestjs/common';
import { ResponseFactory } from './response.factory';
import { ErrorResponseOptions } from '../interfaces/response.interfaces';

/**
 * 404 Not Found
 * Úsalo cuando un recurso no existe.
 */
export const notFoundError = (options: Omit<ErrorResponseOptions, 'code'>) =>
  ResponseFactory.error({ ...options, code: HttpStatus.NOT_FOUND });

/**
 * 409 Conflict
 * Úsalo cuando ocurre un conflicto con el estado actual del recurso.
 * Ej: email duplicado, username ya registrado.
 */
export const conflictError = (options: Omit<ErrorResponseOptions, 'code'>) =>
  ResponseFactory.error({ ...options, code: HttpStatus.CONFLICT });

/**
 * 500 Internal Server Error
 * Úsalo cuando ocurre un error inesperado del servidor.
 */
export const internalServerError = (
  options: Omit<ErrorResponseOptions, 'code'>,
) =>
  ResponseFactory.error({ ...options, code: HttpStatus.INTERNAL_SERVER_ERROR });

/**
 * 400 Bad Request
 * Úsalo cuando los datos enviados por el cliente son inválidos.
 */
export const badRequestError = (options: Omit<ErrorResponseOptions, 'code'>) =>
  ResponseFactory.error({ ...options, code: HttpStatus.BAD_REQUEST });

/**
 * 401 Unauthorized
 * Úsalo cuando el usuario no está autenticado.
 */
export const unauthorizedError = (
  options: Omit<ErrorResponseOptions, 'code'>,
) => ResponseFactory.error({ ...options, code: HttpStatus.UNAUTHORIZED });

/**
 * 403 Forbidden
 * Úsalo cuando el usuario está autenticado pero no tiene permisos.
 */
export const forbiddenError = (options: Omit<ErrorResponseOptions, 'code'>) =>
  ResponseFactory.error({ ...options, code: HttpStatus.FORBIDDEN });

/**
 * 429 Too Many Requests
 * Úsalo cuando se exceden los límites de rate limit.
 */
export const tooManyRequestsError = (
  options: Omit<ErrorResponseOptions, 'code'>,
) => ResponseFactory.error({ ...options, code: HttpStatus.TOO_MANY_REQUESTS });
