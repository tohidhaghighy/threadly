import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "../../persistence/entities/user.entity";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { ThreadEntity } from "../../persistence/entities/thread.entity";
import { ReplyEntity } from "../../persistence/entities/reply.entity";
import { ReplyReactionEntity } from "../../persistence/entities/reply-reaction.entity";
import { UserFollowEntity } from "../../persistence/entities/user-follow.entity";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ThreadEntity, ReplyEntity, ReplyReactionEntity, UserFollowEntity])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}

