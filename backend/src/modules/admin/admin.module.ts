import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThreadEntity } from "../../persistence/entities/thread.entity";
import { AdminThreadsController } from "./admin.threads.controller";
import { AdminUsersController } from "./admin.users.controller";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [TypeOrmModule.forFeature([ThreadEntity]), UsersModule],
  controllers: [AdminThreadsController, AdminUsersController],
})
export class AdminModule {}

