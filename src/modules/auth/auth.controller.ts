import {
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from 'src/modules/auth/auth.service';
import { RegisterDto } from 'src/modules/auth/dto/register.dto';
import { I18n, I18nContext } from 'nestjs-i18n';
import {
  ResetPasswordDto,
  ResetPasswordTokenDto,
} from 'src/modules/auth/dto/reset-password.dto';
import { LoginDto } from 'src/modules/auth/dto/login.dto';
import { Request, Response } from 'express';
import { ensureDeviceId } from 'src/common/helpers/session.helper';
import { Auth } from 'src/modules/auth/decorators/auth.decorator';
import { TwoFactorAuthVerifyDto } from 'src/modules/auth/dto/2fa-verify.dto';
import { TwoFactorEnableDto } from 'src/modules/auth/dto/2fa-enable.dto';
import { TwoFAConfirmDto } from 'src/modules/auth/dto/2fa-confirm.dto';
import { ThorttleLimit } from 'src/common/decorators/throttle.decorator';
import { BruteForce } from 'src/modules/auth/decorators/brute-force.decorator';
import { GithubLoginGuard } from 'src/modules/auth/guards/oauth/github/github-login.guard';
import { GithubLinkGuard } from 'src/modules/auth/guards/oauth/github/github-link.guard';
import { GoogleLoginGuard } from 'src/modules/auth/guards/oauth/google/google-login.guard';
import { GoogleLinkGuard } from 'src/modules/auth/guards/oauth/google/login-link.guard';
import { FacebookLoginGuard } from 'src/modules/auth/guards/oauth/facebook/facebook-login.guard';
import { FacebookLinkGuard } from 'src/modules/auth/guards/oauth/facebook/facebook-link.guard';
import { GoogleOauthGuard } from './guards/oauth/google-oauth.guard';
import { FacebookOauthGuard } from './guards/oauth/facebook-oauth.guard';
import { GithubOauthGuard } from './guards/oauth/github-oauth.guard';
import { OAuthProviderEnum } from 'src/common/enum/user-oauth-providers.enum';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) {}

  @ThorttleLimit(3, 60)
  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @ApiCreatedResponse({ description: 'Usuario registrado exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos de registro inválidos' })
  async register(@Body() registerDto: RegisterDto, @I18n() i18n: I18nContext) {
    return await this.authService.register(registerDto, i18n);
  }

  @ThorttleLimit(3, 60)
  @ApiOperation({ summary: 'Verify email' })
  @ApiOkResponse({ description: 'Email verified successfully' })
  @Get('verify-email/:token')
  async verifyEmail(@Param('token') token: string, @I18n() i18n: I18nContext) {
    return await this.authService.verifyEmail(token, i18n);
  }

  @ThorttleLimit(3, 60)
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password' })
  @ApiOkResponse({ description: 'Password reset successfully' })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @I18n() i18n: I18nContext,
  ) {
    return await this.authService.resetPassword(resetPasswordDto, i18n);
  }

  @ThorttleLimit(3, 60)
  @Post('reset-password/:token')
  @ApiOperation({ summary: 'Reset password' })
  @ApiOkResponse({ description: 'Password reset successfully' })
  async resetPasswordToken(
    @Param('token') token: string,
    @Body() resetPasswordTokenDto: ResetPasswordTokenDto,
    @Req() req: Request,
    @I18n() i18n: I18nContext,
  ) {
    return await this.authService.resetPasswordToken(
      req,
      token,
      resetPasswordTokenDto,
      i18n,
    );
  }

  @ThorttleLimit(3, 60)
  @Auth(null, {
    reauth: true,
  })
  @Post('change-password')
  @ApiOperation({ summary: 'Change password' })
  @ApiOkResponse({ description: 'Password changed successfully' })
  async resetPasswordLooged(
    @Body() resetPasswordTokenDto: ResetPasswordTokenDto,
    @Req() req: Request,
    @I18n() i18n: I18nContext,
    @Headers('X-Reauth-Token') reauthToken: string,
  ) {
    this.logger.debug(reauthToken);
    return await this.authService.resetPasswordLogged(
      req,
      resetPasswordTokenDto,
      i18n,
    );
  }

  @ThorttleLimit(5, 60)
  @BruteForce()
  @Post('sign-in')
  @ApiOperation({ summary: 'Iniciar sesión (Local)' })
  @ApiOkResponse({ description: 'Inicio de sesión exitoso' })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas' })
  async login(
    @Req() req: Request,
    @Body() loginDto: LoginDto,
    @I18n() i18n: I18nContext,
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceId = await ensureDeviceId(req, res);
    return await this.authService.login(req, res, loginDto, deviceId, i18n);
  }

  @Post('refresh-token/:token')
  @ApiOperation({ summary: 'Refresh token' })
  @ApiOkResponse({ description: 'Refresh token successfully' })
  async refreshToken(
    @Param('token') token: string,
    @I18n() i18n: I18nContext,
    @Req() req: Request,
  ) {
    return await this.authService.refreshToken(req, token, i18n);
  }

  // Oauth Google
  @Get('google')
  @ApiOperation({ summary: 'Google login' })
  @UseGuards(GoogleLoginGuard)
  google() {}

  @Get('link/google')
  @ApiOperation({ summary: 'Google link' })
  @UseGuards(GoogleLinkGuard)
  linkGoogle() {}

  @Get('google/callback')
  @ApiOperation({ summary: 'Google callback' })
  @UseGuards(GoogleOauthGuard)
  async googleCallback(
    @Req() req: Request,
    @I18n() i18n: I18nContext,
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceId = await ensureDeviceId(req, res);
    await this.authService.handleOAuthCallback(req, res, deviceId, i18n);
  }

  //  Oauth Facebook
  @Get('facebook')
  @ApiOperation({ summary: 'Facebook login' })
  @UseGuards(FacebookLoginGuard)
  facebook() {}

  @Get('link/facebook')
  @ApiOperation({ summary: 'Facebook link' })
  @UseGuards(FacebookLinkGuard)
  linkFacebook() {}

  @Get('facebook/callback')
  @ApiOperation({ summary: 'Facebook callback' })
  @UseGuards(FacebookOauthGuard)
  async facebookCallback(
    @Req() req: Request,
    @I18n() i18n: I18nContext,
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceId = await ensureDeviceId(req, res);
    await this.authService.handleOAuthCallback(req, res, deviceId, i18n);
  }

  // Oauth Github - updated
  @Get('github')
  @ApiOperation({ summary: 'Github login' })
  @UseGuards(GithubLoginGuard)
  github() {}

  @Auth()
  @Get('/link/github')
  @ApiOperation({ summary: 'Github link' })
  @UseGuards(GithubLinkGuard)
  linkGithub() {}

  @Get('github/callback')
  @ApiOperation({ summary: 'Github callback' })
  @UseGuards(GithubOauthGuard)
  async githubCallback(
    @Req() req: Request,
    @I18n() i18n: I18nContext,
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceId = await ensureDeviceId(req, res);
    await this.authService.handleOAuthCallback(req, res, deviceId, i18n);
  }

  @Auth()
  @Post('logout')
  @ApiOperation({ summary: 'Logout' })
  @ApiOkResponse({ description: 'Logout successfully' })
  async logout(@Req() req: Request, @I18n() i18n: I18nContext) {
    const sessionId = req.user['sessionId'];
    return await this.authService.logout(sessionId, i18n);
  }

  @Auth()
  @Post('logout-device/:deviceId')
  @ApiOperation({ summary: 'Logout device' })
  @ApiOkResponse({ description: 'Logout device successfully' })
  async logoutDevice(
    @Param('deviceId') deviceId: string,
    @I18n() i18n: I18nContext,
  ) {
    return await this.authService.logoutDevice(deviceId, i18n);
  }

  @Auth()
  @Post('logout-all')
  @ApiOperation({ summary: 'Logout all devices' })
  @ApiOkResponse({ description: 'Logout all devices successfully' })
  async logoutAll(@Req() req: Request, @I18n() i18n: I18nContext) {
    const sessionId = req.user['sessionId'];
    const userId = req.user['sub'];
    return await this.authService.logoutAll(userId, sessionId, i18n);
  }

  @ThorttleLimit(5, 60)
  @Post('2fa/verify')
  @ApiOperation({ summary: 'Verify 2fa' })
  @ApiOkResponse({ description: 'Verify 2fa successfully' })
  async verify2fa(
    @Req() req: Request,
    @Body() twoFactorAuthVerifyDto: TwoFactorAuthVerifyDto,
    @I18n() i18n: I18nContext,
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceId = await ensureDeviceId(req, res);
    return await this.authService.verify2fa(
      req,
      res,
      twoFactorAuthVerifyDto,
      i18n,
      deviceId,
    );
  }

  @ThorttleLimit(3, 60)
  @Auth(null, {
    reauth: true,
  })
  @Post('2fa/enable')
  @ApiOperation({ summary: 'Enable 2fa' })
  @ApiOkResponse({ description: 'Enable 2fa successfully' })
  async enable2fa(
    @Req() req: Request,
    @Body() twoFactorEnableDto: TwoFactorEnableDto,
    @I18n() i18n: I18nContext,
    @Headers('X-Reauth-Token') reauthToken: string,
  ) {
    this.logger.debug(reauthToken);
    return await this.authService.enable2fa(req, twoFactorEnableDto, i18n);
  }

  @ThorttleLimit(3, 60)
  @Auth()
  @Post('2fa/confirm')
  @ApiOperation({ summary: 'Confirm 2fa' })
  @ApiOkResponse({ description: 'Confirm 2fa successfully' })
  async confirm2fa(
    @Req() req: Request,
    @Body() twoFAConfirmDto: TwoFAConfirmDto,
    @I18n() i18n: I18nContext,
  ) {
    return await this.authService.confirm2fa(req, twoFAConfirmDto, i18n);
  }

  @ThorttleLimit(2, 60)
  @Auth()
  @Post('2fa/disable')
  @ApiOperation({ summary: 'Disable 2fa' })
  @ApiOkResponse({ description: 'Disable 2fa successfully' })
  async disable2fa(@Req() req: Request, @I18n() i18n: I18nContext) {
    return await this.authService.disable2fa(req, i18n);
  }

  @ThorttleLimit(2, 60)
  @Auth()
  @Post('unlink/:provider')
  @ApiOperation({ summary: 'Unlink OAuth provider' })
  @ApiOkResponse({ description: 'OAuth provider unlinked successfully' })
  async unlinkProvider(
    @Req() req: Request,
    @Param('provider') provider: OAuthProviderEnum,
    @I18n() i18n: I18nContext,
  ) {
    return await this.authService.unlinkProvider(req, provider, i18n);
  }
}
