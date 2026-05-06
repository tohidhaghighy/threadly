import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CategoryEntity } from "../../persistence/entities/category.entity";
import { ThreadEntity } from "../../persistence/entities/thread.entity";
import { CategoriesService } from "./categories.service";
import { AdminCategoriesController, CategoriesController } from "./categories.controller";

@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity, ThreadEntity])],
  providers: [CategoriesService],
  controllers: [CategoriesController, AdminCategoriesController],
})
export class CategoriesModule {}

