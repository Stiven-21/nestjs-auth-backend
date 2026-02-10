import { HttpException } from '@nestjs/common';
import {
  SuccessResponseOptions,
  ErrorResponseOptions,
} from 'src/common/interfaces/response.interfaces';

export class ResponseFactory {
  static success({
    i18n,
    lang,
    code,
    description,
    data,
    args = {},
  }: SuccessResponseOptions) {
    return {
      statusCode: code,
      message: i18n.t(`status.${code}.message`, { lang, args }),
      description:
        description || i18n.t(`status.${code}.description`, { lang, args }),
      data,
    };
  }

  static error({
    i18n,
    lang,
    code,
    args = {},
    description,
  }: ErrorResponseOptions) {
    const message = i18n.t(`status.${code}.message`, { lang, args });
    const desc =
      description || i18n.t(`status.${code}.description`, { lang, args });
    throw new HttpException(
      {
        statusCode: code,
        message,
        description: desc,
      },
      code,
      { cause: new Error() },
    );
  }
}
