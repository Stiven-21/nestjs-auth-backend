import { ExecutionContext, Injectable, Type } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard, IAuthGuard } from '@nestjs/passport';
import { Request } from 'express';

import { OAuthStateService } from 'src/modules/auth/oauth/oauth.service';

export type OAuthFlow = 'login' | 'link';

export interface OAuthStatePayload {
  flow: OAuthFlow;
  userId?: number;
}

/**
 * Factory para crear OAuth Guards (Google, GitHub, Facebook)
 */
export function BaseOauthGuard(
  strategy: string,
  flow: OAuthFlow,
): Type<IAuthGuard> {
  @Injectable()
  class OAuthGuard extends AuthGuard(strategy) {
    constructor(
      private readonly oauthStateService: OAuthStateService,
      private readonly jwtService: JwtService,
    ) {
      super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req: Request = context.switchToHttp().getRequest();
      const options: Record<string, any> = {};
      const token =
        req.cookies?.access_token ||
        req.headers.authorization?.split(' ')[1] ||
        req.query.token;

      let userId: number | undefined;

      if (flow === 'link' && token) {
        const decoded = this.jwtService.decode(token) as any;
        userId = decoded?.sub;
      }

      const payload: OAuthStatePayload =
        flow === 'link' ? { flow: 'link', userId } : { flow: 'login' };

      options.state = this.oauthStateService.sign(payload);

      (this as any).options = options;

      return (await super.canActivate(context)) as boolean;
    }
  }

  return OAuthGuard;
}
