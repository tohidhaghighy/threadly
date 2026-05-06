import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReplyEntity } from "../../persistence/entities/reply.entity";
import { ThreadEntity } from "../../persistence/entities/thread.entity";
import { RepliesService } from "./replies.service";
import { RepliesController } from "./replies.controller";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [TypeOrmModule.forFeature([ReplyEntity, ThreadEntity]), UsersModule],
  providers: [RepliesService],
  controllers: [RepliesController],
})
export class RepliesModule {}

