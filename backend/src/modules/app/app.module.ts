import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";

import { AuthModule } from "../auth/auth.module";
import { ThreadsModule } from "../threads/threads.module";
import { RepliesModule } from "../replies/replies.module";
import { AdminModule } from "../admin/admin.module";
import { UsersModule } from "../users/users.module";
import { CategoriesModule } from "../categories/categories.module";

import { UserEntity } from "../../persistence/entities/user.entity";
import { ThreadEntity } from "../../persistence/entities/thread.entity";
import { ReplyEntity } from "../../persistence/entities/reply.entity";
import { AttachmentEntity } from "../../persistence/entities/attachment.entity";
import { CategoryEntity } from "../../persistence/entities/category.entity";
import { SeedService } from "./seed.service";
import { StatsController } from "./stats.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), "uploads"),
      serveRoot: "/uploads",
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "sqlite",
        database: config.get<string>("DB_PATH") ?? "threadly.sqlite",
        entities: [UserEntity, ThreadEntity, ReplyEntity, AttachmentEntity, CategoryEntity],
        synchronize: true,
        logging: false,
      }),
    }),
    TypeOrmModule.forFeature([UserEntity, ThreadEntity, CategoryEntity]),
    AuthModule,
    UsersModule,
    ThreadsModule,
    CategoriesModule,
    RepliesModule,
    AdminModule,
  ],
  controllers: [StatsController],
  providers: [SeedService],
})
export class AppModule {
  constructor(private readonly seed: SeedService) {}

  async onModuleInit() {
    await this.seed.seedAdmin();
    await this.seed.seedCategories();
  }
}

