import { Controller, Get, Param } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";

import { PageSeoService } from "./page-seo.service";

@ApiTags("seo")
@Controller("api/seo/pages")
export class PageSeoController {
  constructor(private readonly pages: PageSeoService) {}

  @Get()
  @ApiResponse({ status: 200 })
  list() {
    return this.pages.list();
  }

  @Get(":pageKey")
  @ApiResponse({ status: 200 })
  get(@Param("pageKey") pageKey: string) {
    return this.pages.getByKey(pageKey);
  }
}
