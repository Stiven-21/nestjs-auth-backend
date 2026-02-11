import { ResponseFactory } from 'src/common/exceptions/response.factory';
import { SuccessResponseOptions } from 'src/common/interfaces/response.interfaces';

export const okResponse = <T>(
  options: Omit<SuccessResponseOptions<T>, 'meta'> & { meta?: any },
) =>
  ResponseFactory.success({
    data: options.data,
    meta: options.meta ?? null,
  });

export const createdResponse = <T>(
  options: Omit<SuccessResponseOptions<T>, 'meta'> & { meta?: any },
) =>
  ResponseFactory.success({
    data: options.data,
    meta: options.meta ?? null,
  });

export const noContentResponse = () =>
  ResponseFactory.success({
    data: null,
    meta: null,
  });
