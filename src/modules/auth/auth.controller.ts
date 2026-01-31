import {
  Body,
  Controller,
  Get,
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
} from './dto/reset-password.dto';
import { LoginDto } from 'src/modules/auth/dto/login.dto';
import { Request, Response } from 'express';
import { GoogleOauthGuard } from 'src/modules/auth/guards/oauth/google-oauth.guard';
import { FacebookOauthGuard } from 'src/modules/auth/guards/oauth/facebook-oauth.guard';
import { GithubOauthGuard } from 'src/modules/auth/guards/oauth/github-oauth.guard';
import { ensureDeviceId } from 'src/common/helpers/session.helper';
import { Auth } from './decorators/auth.decorator';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto, @I18n() i18n: I18nContext) {
    return await this.authService.register(registerDto, i18n);
  }

  @Get('verify-email/:token')
  async verifyEmail(@Param('token') token: string, @I18n() i18n: I18nContext) {
    return await this.authService.verifyEmail(token, i18n);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @I18n() i18n: I18nContext,
  ) {
    return await this.authService.resetPassword(resetPasswordDto, i18n);
  }

  @Post('reset-password-token/:token')
  async resetPasswordToken(
    @Param('token') token: string,
    @Body() resetPasswordTokenDto: ResetPasswordTokenDto,
    @I18n() i18n: I18nContext,
  ) {
    return await this.authService.resetPasswordToken(
      token,
      resetPasswordTokenDto,
      i18n,
    );
  }

  @Post('sign-in')
  async login(
    @Req() req: Request,
    @Body() loginDto: LoginDto,
    @I18n() i18n: I18nContext,
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceId = await ensureDeviceId(req, res);
    return await this.authService.login(req, loginDto, deviceId, i18n);
  }

  @Get('refresh-token/:token')
  async refreshToken(@Param('token') token: string, @I18n() i18n: I18nContext) {
    return await this.authService.refreshToken(token, i18n);
  }

  // Oauth Google
  @Get('google')
  @UseGuards(GoogleOauthGuard)
  google() {}

  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleCallback(
    @Req() req: Request,
    @I18n() i18n: I18nContext,
    @Res({ passthrough: true }) res: Response,
  ) {
    const id: number = req.user['id'];
    const deviceId = await ensureDeviceId(req, res);
    return await this.authService.loginById(req, id, deviceId, i18n);
  }

  //  Oauth Facebook
  @Get('facebook')
  @UseGuards(FacebookOauthGuard)
  facebook() {}

  @Get('facebook/callback')
  @UseGuards(FacebookOauthGuard)
  async facebookCallback(
    @Req() req: Request,
    @I18n() i18n: I18nContext,
    @Res({ passthrough: true }) res: Response,
  ) {
    const id: number = req.user['id'];
    const deviceId = await ensureDeviceId(req, res);
    return await this.authService.loginById(req, id, deviceId, i18n);
  }

  // Oauth Github
  @Get('github')
  @UseGuards(GithubOauthGuard)
  github() {}

  @Get('github/callback')
  @UseGuards(GithubOauthGuard)
  async githubCallback(
    @Req() req: Request,
    @I18n() i18n: I18nContext,
    @Res({ passthrough: true }) res: Response,
  ) {
    const id: number = req.user['id'];
    const deviceId = await ensureDeviceId(req, res);
    return await this.authService.loginById(req, id, deviceId, i18n);
  }

  @Get('logout')
  @Auth()
  async logout(@Req() req: Request, @I18n() i18n: I18nContext) {
    const sessionId = req.user['sessionId'];
    return await this.authService.logout(sessionId, i18n);
  }

  @Post('logout-device/:deviceId')
  @Auth()
  async logoutDevice(
    @Param('deviceId') deviceId: string,
    @I18n() i18n: I18nContext,
  ) {
    return await this.authService.logoutDevice(deviceId, i18n);
  }

  @Post('logout-all')
  @Auth()
  async logoutAll(@Req() req: Request, @I18n() i18n: I18nContext) {
    const sessionId = req.user['sessionId'];
    const userId = req.user['sub'];
    return await this.authService.logoutAll(userId, sessionId, i18n);
  }
}
