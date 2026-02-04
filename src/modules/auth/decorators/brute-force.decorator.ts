import { applyDecorators, UseGuards } from '@nestjs/common';
import { BruteForceGuard } from 'src/modules/auth/guards/brute-force.guard';

export const BruteForce = () => {
  return applyDecorators(UseGuards(BruteForceGuard));
};
