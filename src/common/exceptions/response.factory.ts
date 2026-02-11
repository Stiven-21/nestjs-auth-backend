import { HttpException, HttpStatus } from '@nestjs/common';
import {
  SuccessResponseOptions,
  ErrorResponseOptions,
} from 'src/common/interfaces/response.interfaces';
import { ErrorHttpStatusMap } from 'src/common/enum/errors/error-http-status.map';

export class ResponseFactory {
  static success<T>({ data, meta = null }: SuccessResponseOptions<T>) {
    return {
      success: true,
      data,
      meta,
      error: null,
    };
  }

  static error({ i18n, lang, code, args = {} }: ErrorResponseOptions) {
    const message = i18n.t(`errors.${code}`, { lang, args });

    throw new HttpException(
      {
        success: false,
        data: null,
        meta: null,
        error: {
          code,
          message,
        },
      },
      ErrorHttpStatusMap[code] ?? HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
