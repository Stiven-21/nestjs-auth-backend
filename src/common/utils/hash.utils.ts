import * as crypto from 'crypto';

export const hashValue = (value: string) => {
  return crypto.createHash('sha256').update(value).digest('hex');
};
