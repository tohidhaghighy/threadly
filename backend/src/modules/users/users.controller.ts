import { Body, Controller, Get, Param, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { ApiBearerAuth, ApiBody, ApiConsumes } from "@nestjs/swagger";
import type { Request } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { join, extname } from "path";
import { randomUUID } from "crypto";

@ApiTags("users")
@Controller("api/users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get("avatar-samples")
  @ApiResponse({
    status: 200,
    schema: { example: { items: [{ url: "/uploads/avatars/sample-1.svg" }] } },
  })
  avatarSamples() {
    return this.users.avatarSamples();
  }

  @Get("leaderboard")
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        items: [
          {
            id: "uuid",
            name: "Alice",
            avatarUrl: null,
            points: 42,
            rank: 1,
            breakdown: { threads: 2, comments: 6, reactions: 10 },
          },
        ],
        nextCursor: null,
      },
    },
  })
  leaderboard(@Query("limit") limit?: string) {
    return this.users.leaderboard({ limit });
  }

  @Get(":id/profile")
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        id: "uuid",
        name: "Alice",
        avatarUrl: null,
        points: 42,
        rank: 1,
        breakdown: { threads: 2, comments: 6, reactions: 10 },
        totalUsers: 12,
      },
    },
  })
  profile(@Param("id") id: string) {
    return this.users.profile(id);
  }

  @Get(":id/points-events")
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        items: [
          {
            id: "thread:uuid",
            type: "thread",
            points: 10,
            createdAt: "2026-01-01T12:00:00.000Z",
            thread: { id: "uuid", title: "Hello" },
          },
        ],
        nextCursor: null,
      },
    },
  })
  pointsEvents(@Param("id") id: string, @Query("limit") limit?: string) {
    return this.users.pointsEvents(id, { limit });
  }

  @Get("me/alerts")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        items: [
          {
            id: "mention:uuid",
            type: "mention",
            createdAt: "2026-01-01T12:00:00.000Z",
            message: "Ali از شما منشن کرد.",
            thread: { id: "uuid", title: "Hello" },
            reply: { id: "uuid", excerpt: "@user ..." },
            actor: { id: "uuid", name: "Ali", avatarUrl: null },
          },
          {
            id: "thread-activity:uuid",
            type: "thread_activity",
            createdAt: "2026-01-01T11:00:00.000Z",
            message: "موضوع شما ۲ پاسخ و ۱ لایک دارد.",
            thread: { id: "uuid", title: "My Thread" },
          },
        ],
        nextCursor: null,
      },
    },
  })
  myAlerts(@Req() req: Request, @Query("limit") limit?: string) {
    const user = req.user as { userId: string };
    return this.users.alertsForUser(user.userId, { limit });
  }

  @Post("me/avatar-sample")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({ schema: { example: { url: "/uploads/avatars/sample-1.svg" } } })
  setMyAvatarSample(@Req() req: Request, @Body() body: { url?: string }) {
    const user = req.user as { userId: string };
    return this.users.setAvatarUrl(user.userId, body.url ?? null, { allowSamplesOnly: true });
  }

  @Post("me/avatar")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("avatar", {
      storage: diskStorage({
        destination: join(process.cwd(), "uploads", "avatars"),
        filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname)}`),
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) return cb(null, false);
        cb(null, true);
      },
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  )
  async uploadMyAvatar(@Req() req: Request, @UploadedFile() file?: Express.Multer.File) {
    const user = req.user as { userId: string };
    if (!file) return this.users.setAvatarUrl(user.userId, null);
    return this.users.setAvatarUrl(user.userId, `/uploads/avatars/${file.filename}`);
  }
}

