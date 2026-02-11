export interface SuccessResponseOptions<T> {
  data: T;
  meta?: Record<string, any> | null;
}

export interface ErrorResponseOptions {
  i18n: any;
  lang: string;
  code: string;
  args?: Record<string, any>;
}
