import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { PageSeoEntity } from "../../persistence/entities/page-seo.entity";
import { AdminPageSeoController } from "./admin.page-seo.controller";
import { PageSeoController } from "./page-seo.controller";
import { PageSeoService } from "./page-seo.service";

@Module({
  imports: [TypeOrmModule.forFeature([PageSeoEntity])],
  controllers: [PageSeoController, AdminPageSeoController],
  providers: [PageSeoService],
  exports: [PageSeoService],
})
export class PageSeoModule {}
