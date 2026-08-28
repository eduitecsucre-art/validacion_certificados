import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Límite específico y más estricto para login: máximo 5 intentos
  // cada 5 minutos, por IP. Sobrescribe el límite general (60/min)
  // solo para esta ruta, ya que es el punto de entrada más sensible
  // a ataques de fuerza bruta.
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: any) {
    return this.authService.me(req.user.id);
  }
}