import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RepliesService } from "./replies.service";
import { CreateReplyDto } from "./dto";

@ApiTags("replies")
@Controller("api/threads/:id/replies")
export class RepliesController {
  constructor(private readonly replies: RepliesService) {}

  @Get()
  list(@Param("id") threadId: string) {
    return this.replies.list(threadId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({ schema: { example: { content: "برای شروع، CMOS را ریست کن و با یک RAM تست کن." } } })
  @ApiResponse({ status: 201, schema: { example: { id: "uuid" } } })
  create(@Param("id") threadId: string, @Req() req: Request, @Body() dto: CreateReplyDto) {
    const user = req.user as { userId: string };
    return this.replies.create(threadId, { authorId: user.userId, content: dto.content });
  }
}

