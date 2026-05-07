import { Body, Controller, Param, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RepliesService } from "./replies.service";
import type { ReplyReactionEmoji } from "./reply-interactions.constants";
import { ToggleReactionDto } from "./dto";

@ApiTags("replies")
@Controller("api/replies")
export class ReplyInteractionsController {
  constructor(private readonly replies: RepliesService) {}

  @Post(":id/like")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, schema: { example: { likesCount: 3, likedByMe: true } } })
  toggleLike(@Param("id") replyId: string, @Req() req: Request) {
    const user = req.user as { userId: string };
    return this.replies.toggleLike(replyId, user.userId);
  }

  @Post(":id/reactions")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({ schema: { example: { emoji: "👍" } } })
  @ApiResponse({
    status: 200,
    schema: { example: { reactions: [{ emoji: "👍", count: 2, reactedByMe: true }] } },
  })
  toggleReaction(@Param("id") replyId: string, @Req() req: Request, @Body() dto: ToggleReactionDto) {
    const user = req.user as { userId: string };
    return this.replies.toggleReaction(replyId, user.userId, dto.emoji as ReplyReactionEmoji);
  }
}
