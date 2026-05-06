import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThreadEntity } from "../../persistence/entities/thread.entity";
import { AttachmentEntity } from "../../persistence/entities/attachment.entity";
import { ThreadsService } from "./threads.service";
import { ThreadsController } from "./threads.controller";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [TypeOrmModule.forFeature([ThreadEntity, AttachmentEntity]), UsersModule],
  providers: [ThreadsService],
  controllers: [ThreadsController],
  exports: [ThreadsService],
})
export class ThreadsModule {}

