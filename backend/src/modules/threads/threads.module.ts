import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThreadEntity } from "../../persistence/entities/thread.entity";
import { AttachmentEntity } from "../../persistence/entities/attachment.entity";
import { ThreadLikeEntity } from "../../persistence/entities/thread-like.entity";
import { ThreadViewEntity } from "../../persistence/entities/thread-view.entity";
import { ThreadsService } from "./threads.service";
import { ThreadsController } from "./threads.controller";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [TypeOrmModule.forFeature([ThreadEntity, AttachmentEntity, ThreadLikeEntity, ThreadViewEntity]), UsersModule],
  providers: [ThreadsService],
  controllers: [ThreadsController],
  exports: [ThreadsService],
})
export class ThreadsModule {}

