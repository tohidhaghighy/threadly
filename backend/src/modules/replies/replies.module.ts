import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReplyEntity } from "../../persistence/entities/reply.entity";
import { ThreadEntity } from "../../persistence/entities/thread.entity";
import { ReplyLikeEntity } from "../../persistence/entities/reply-like.entity";
import { ReplyReactionEntity } from "../../persistence/entities/reply-reaction.entity";
import { ReplyAttachmentEntity } from "../../persistence/entities/reply-attachment.entity";
import { RepliesService } from "./replies.service";
import { RepliesController } from "./replies.controller";
import { ReplyInteractionsController } from "./reply-interactions.controller";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [TypeOrmModule.forFeature([ReplyEntity, ThreadEntity, ReplyLikeEntity, ReplyReactionEntity, ReplyAttachmentEntity]), UsersModule],
  providers: [RepliesService],
  controllers: [RepliesController, ReplyInteractionsController],
})
export class RepliesModule {}

