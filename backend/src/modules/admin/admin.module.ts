import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThreadEntity } from "../../persistence/entities/thread.entity";
import { AdminThreadsController } from "./admin.threads.controller";
import { AdminUsersController } from "./admin.users.controller";
import { AdminRepliesController } from "./admin.replies.controller";
import { AdminReactionsController } from "./admin.reactions.controller";
import { UsersModule } from "../users/users.module";
import { ReplyEntity } from "../../persistence/entities/reply.entity";
import { UserEntity } from "../../persistence/entities/user.entity";
import { ReplyReactionEntity } from "../../persistence/entities/reply-reaction.entity";
import { ReplyLikeEntity } from "../../persistence/entities/reply-like.entity";
import { ReplyAttachmentEntity } from "../../persistence/entities/reply-attachment.entity";
import { AttachmentEntity } from "../../persistence/entities/attachment.entity";
import { ThreadLikeEntity } from "../../persistence/entities/thread-like.entity";
import { ThreadViewEntity } from "../../persistence/entities/thread-view.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ThreadEntity,
      ReplyEntity,
      UserEntity,
      ReplyReactionEntity,
      ReplyLikeEntity,
      ReplyAttachmentEntity,
      AttachmentEntity,
      ThreadLikeEntity,
      ThreadViewEntity,
    ]),
    UsersModule,
  ],
  controllers: [AdminThreadsController, AdminUsersController, AdminRepliesController, AdminReactionsController],
})
export class AdminModule {}
