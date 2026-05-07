import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThreadEntity } from "../../persistence/entities/thread.entity";
import { AdminThreadsController } from "./admin.threads.controller";
import { AdminUsersController } from "./admin.users.controller";
import { AdminRepliesController } from "./admin.replies.controller";
import { UsersModule } from "../users/users.module";
import { ReplyEntity } from "../../persistence/entities/reply.entity";
import { UserEntity } from "../../persistence/entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ThreadEntity, ReplyEntity, UserEntity]), UsersModule],
  controllers: [AdminThreadsController, AdminUsersController, AdminRepliesController],
})
export class AdminModule {}

