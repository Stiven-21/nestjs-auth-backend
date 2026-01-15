import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { I18n, I18nContext } from 'nestjs-i18n';
import {
  ResetPasswordDto,
  ResetPasswordTokenDto,
} from './dto/reset-password.dto';
import { LoginDto } from './dto/login.dto';
import { Request } from 'express';
import { GoogleAuthGuard } from './guards/oauth/google-auth.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
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
  ) {
    return await this.authService.login(req, loginDto, i18n);
  }

  @Get('refresh-token')
  async refreshToken(@Param('token') token: string, @I18n() i18n: I18nContext) {
    return await this.authService.refreshToken(token, i18n);
  }

  // Oauth Google
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  google() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req, @I18n() i18n: I18nContext) {
    const id: number = req.user.id;
    return await this.authService.loginById(req, id, i18n);
  }

  //  Oauth Facebook
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  facebook() {}

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookCallback(@Req() req, @I18n() i18n: I18nContext) {
    const id: number = req.user.id;
    return await this.authService.loginById(req, id, i18n);
  }

  // Oauth Github
  @Get('github')
  @UseGuards(AuthGuard('github'))
  github() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req, @I18n() i18n: I18nContext) {
    const id: number = req.user.id;
    return await this.authService.loginById(req, id, i18n);
  }
}
