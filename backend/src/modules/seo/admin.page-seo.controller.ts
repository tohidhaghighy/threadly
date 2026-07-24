import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "../auth/jwt.guard";
import { AdminOnlyGuard } from "../auth/roles.guard";
import { UpdatePageSeoDto } from "./dto";
import { PageSeoService } from "./page-seo.service";

@ApiTags("admin")
@ApiBearerAuth()
@Controller("api/admin/seo/pages")
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
export class AdminPageSeoController {
  constructor(private readonly pages: PageSeoService) {}

  @Get()
  list() {
    return this.pages.list();
  }

  @Patch(":pageKey")
  @ApiBody({ type: UpdatePageSeoDto })
  @ApiResponse({ status: 200 })
  update(@Param("pageKey") pageKey: string, @Body() dto: UpdatePageSeoDto) {
    return this.pages.update(pageKey, dto);
  }
}
