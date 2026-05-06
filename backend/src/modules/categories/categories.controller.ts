import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from "@nestjs/swagger";

import { CategoriesService } from "./categories.service";
import { CreateCategoryDto, UpdateCategoryDto } from "./dto";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { AdminOnlyGuard } from "../auth/roles.guard";

@ApiTags("categories")
@Controller("api/categories")
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        items: [
          {
            id: "uuid",
            title: "مونتاژ PC",
            description: "راهنمای ساخت، انتخاب قطعات و مونتاژ",
            order: 1,
            isActive: true,
            threadsCount: 12,
          },
        ],
      },
    },
  })
  listPublic() {
    return this.categories.listPublic();
  }
}

@ApiTags("admin")
@Controller("api/admin/categories")
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
@ApiBearerAuth()
export class AdminCategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  listAdmin(@Query("q") q?: string) {
    return this.categories.listAdmin({ q });
  }

  @Post()
  @ApiBody({ type: CreateCategoryDto })
  create(@Body() dto: CreateCategoryDto) {
    return this.categories.create(dto);
  }

  @Patch(":id")
  @ApiBody({ type: UpdateCategoryDto })
  update(@Param("id") id: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.categories.remove(id);
  }
}

