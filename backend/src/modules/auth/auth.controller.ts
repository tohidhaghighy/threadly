import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "./auth.service";
import { ChangePasswordDto, LoginDto, RegisterDto } from "./dto";
import { JwtAuthGuard } from "./jwt.guard";
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("auth")
@Controller("api/auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  @ApiBody({
    schema: {
      example: { name: "علی رضایی", email: "ali@example.com", password: "password123" },
    },
  })
  @ApiResponse({
    status: 201,
    schema: {
      example: {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        user: { id: "uuid", name: "علی رضایی", email: "ali@example.com", role: "user", status: "active" },
      },
    },
  })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post("login")
  @ApiBody({
    schema: {
      example: { email: "admin@threadly.com", password: "threadly" },
    },
  })
  @ApiResponse({
    status: 201,
    schema: {
      example: {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        user: { id: "uuid", name: "Threadly Admin", email: "admin@threadly.com", role: "admin", status: "active" },
      },
    },
  })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    schema: {
      example: { id: "uuid", name: "Threadly Admin", email: "admin@threadly.com", role: "admin", status: "active" },
    },
  })
  me(@Req() req: Request) {
    const user = req.user as { userId: string };
    return this.auth.me(user.userId);
  }

  @Post("change-password")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      example: { currentPassword: "password123", newPassword: "newpassword123" },
    },
  })
  @ApiResponse({ status: 201, schema: { example: { ok: true } } })
  changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    const user = req.user as { userId: string };
    return this.auth.changePassword(user.userId, dto);
  }
}

