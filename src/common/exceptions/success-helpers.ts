import { HttpStatus } from '@nestjs/common';
import { ResponseFactory } from './response.factory';
import { SuccessResponseOptions } from '../interfaces/response.interfaces';

/**
 * 200 OK
 * Úsalo para respuestas exitosas estándar.
 */
export const okResponse = (options: Omit<SuccessResponseOptions, 'code'>) =>
  ResponseFactory.success({ ...options, code: HttpStatus.OK });

/**
 * 201 Created
 * Úsalo cuando un recurso ha sido creado exitosamente.
 */
export const createdResponse = (
  options: Omit<SuccessResponseOptions, 'code'>,
) => ResponseFactory.success({ ...options, code: HttpStatus.CREATED });

/**
 * 202 Accepted
 * Úsalo cuando la solicitud se aceptó pero se procesará asíncronamente.
 */
export const acceptedResponse = (
  options: Omit<SuccessResponseOptions, 'code'>,
) => ResponseFactory.success({ ...options, code: HttpStatus.ACCEPTED });

/**
 * 204 No Content
 * Úsalo cuando todo salió bien pero no se debe devolver contenido.
 */
export const noContentResponse = (
  options: Omit<SuccessResponseOptions, 'code'>,
) => ResponseFactory.success({ ...options, code: HttpStatus.NO_CONTENT });
