import { applyDecorators, UseGuards } from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';

export const ThorttleLimit = (limit: number, ttl: number) => {
  return applyDecorators(
    UseGuards(ThrottlerGuard),
    Throttle({ default: { limit, ttl: ttl * 1000 } }),
  );
};
