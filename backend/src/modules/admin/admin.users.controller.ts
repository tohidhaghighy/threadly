import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { AdminOnlyGuard } from "../auth/roles.guard";
import { UsersService } from "../users/users.service";
import { IsIn } from "class-validator";
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from "@nestjs/swagger";

class SetRoleDto {
  @IsIn(["user", "admin"])
  role!: "user" | "admin";
}

class SetStatusDto {
  @IsIn(["active", "banned"])
  status!: "active" | "banned";
}

@Controller("api/admin/users")
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
@ApiTags("admin")
@ApiBearerAuth()
export class AdminUsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@Query("q") q?: string, @Query("role") role?: "user" | "admin", @Query("status") status?: "active" | "banned") {
    return this.users.listAdmin({ q, role, status });
  }

  @Get(":id")
  @ApiResponse({
    status: 200,
    description: "Admin user profile with threads, comments, and reactions",
  })
  detail(@Param("id") id: string) {
    return this.users.adminUserDetail(id);
  }

  @Post(":id/role")
  @ApiBody({ schema: { example: { role: "admin" } } })
  @ApiResponse({ status: 201, schema: { example: { id: "uuid", role: "admin" } } })
  setRole(@Param("id") id: string, @Body() dto: SetRoleDto) {
    return this.users.setRole(id, dto.role);
  }

  @Post(":id/ban")
  @ApiBody({ schema: { example: { status: "banned" } } })
  @ApiResponse({ status: 201, schema: { example: { id: "uuid", status: "banned" } } })
  setStatus(@Param("id") id: string, @Body() dto: SetStatusDto) {
    return this.users.setStatus(id, dto.status);
  }
}
