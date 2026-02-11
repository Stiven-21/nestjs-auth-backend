import { ResponseFactory } from 'src/common/exceptions/response.factory';
import { ErrorResponseOptions } from 'src/common/interfaces/response.interfaces';

export const userNotFoundError = (
  options: Omit<ErrorResponseOptions, 'code'>,
) =>
  ResponseFactory.error({
    ...options,
    code: 'USER_NOT_FOUND',
  });

export const invalidCredentialsError = (
  options: Omit<ErrorResponseOptions, 'code'>,
) =>
  ResponseFactory.error({
    ...options,
    code: 'INVALID_CREDENTIALS',
  });

export const emailAlreadyExistsError = (
  options: Omit<ErrorResponseOptions, 'code'>,
) =>
  ResponseFactory.error({
    ...options,
    code: 'EMAIL_ALREADY_EXISTS',
  });

export const forbiddenActionError = (
  options: Omit<ErrorResponseOptions, 'code'>,
) =>
  ResponseFactory.error({
    ...options,
    code: 'FORBIDDEN_ACTION',
  });

export const rateLimitExceededError = (
  options: Omit<ErrorResponseOptions, 'code'>,
) =>
  ResponseFactory.error({
    ...options,
    code: 'RATE_LIMIT_EXCEEDED',
  });

export const internalServerError = (
  options: Omit<ErrorResponseOptions, 'code'>,
) =>
  ResponseFactory.error({
    ...options,
    code: 'INTERNAL_ERROR',
  });
