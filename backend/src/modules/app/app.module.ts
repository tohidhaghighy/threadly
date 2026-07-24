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
import { PageSeoModule } from "../seo/page-seo.module";

import { UserEntity } from "../../persistence/entities/user.entity";
import { ThreadEntity } from "../../persistence/entities/thread.entity";
import { ReplyEntity } from "../../persistence/entities/reply.entity";
import { ReplyLikeEntity } from "../../persistence/entities/reply-like.entity";
import { ReplyReactionEntity } from "../../persistence/entities/reply-reaction.entity";
import { AttachmentEntity } from "../../persistence/entities/attachment.entity";
import { CategoryEntity } from "../../persistence/entities/category.entity";
import { ThreadLikeEntity } from "../../persistence/entities/thread-like.entity";
import { ThreadViewEntity } from "../../persistence/entities/thread-view.entity";
import { ReplyAttachmentEntity } from "../../persistence/entities/reply-attachment.entity";
import { PageSeoEntity } from "../../persistence/entities/page-seo.entity";
import { SeedService } from "./seed.service";
import { StatsController } from "./stats.controller";
import { SeoController } from "./seo.controller";

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
        entities: [
          UserEntity,
          ThreadEntity,
          ReplyEntity,
          ReplyLikeEntity,
          ReplyReactionEntity,
          ReplyAttachmentEntity,
          AttachmentEntity,
          CategoryEntity,
          ThreadLikeEntity,
          ThreadViewEntity,
          PageSeoEntity,
        ],
        synchronize: true,
        logging: false,
      }),
    }),
    TypeOrmModule.forFeature([UserEntity, ThreadEntity, ReplyEntity, CategoryEntity]),
    AuthModule,
    UsersModule,
    ThreadsModule,
    CategoriesModule,
    RepliesModule,
    AdminModule,
    PageSeoModule,
  ],
  controllers: [StatsController, SeoController],
  providers: [SeedService],
})
export class AppModule {
  constructor(private readonly seed: SeedService) {}

  async onModuleInit() {
    await this.seed.seedAdmin();
    await this.seed.seedCategories();
    await this.seed.seedAdminFaqQa();
    if (process.env.SEED_DEMO_DATA === "true") {
      await this.seed.seedHardwareAssemblyQa();
      await this.seed.dedupeThreadContents();
    }
    this.seed.seedAvatarSamples();
  }
}

