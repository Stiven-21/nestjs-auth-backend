import { Module } from '@nestjs/common';
import { ThrottlerModule as NestThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    NestThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: Number(process.env.THROTTLER_TTL) || 60,
          limit: Number(process.env.THROTTLER_LIMIT) || 10,
        },
      ],
    }),
  ],
})
export class ThrottlerModule {}
