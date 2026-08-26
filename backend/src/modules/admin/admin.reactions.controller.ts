import { Controller, Delete, NotFoundException, Param, UseGuards } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ApiBearerAuth, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Repository } from "typeorm";

import { JwtAuthGuard } from "../auth/jwt.guard";
import { AdminOnlyGuard } from "../auth/roles.guard";
import { ReplyReactionEntity } from "../../persistence/entities/reply-reaction.entity";

@ApiTags("admin")
@ApiBearerAuth()
@Controller("api/admin/reactions")
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
export class AdminReactionsController {
  constructor(
    @InjectRepository(ReplyReactionEntity) private readonly reactionsRepo: Repository<ReplyReactionEntity>,
  ) {}

  @Delete(":id")
  @ApiResponse({ status: 200, schema: { example: { ok: true } } })
  async remove(@Param("id") id: string) {
    const reaction = await this.reactionsRepo.findOne({ where: { id } });
    if (!reaction) throw new NotFoundException("Reaction not found");
    await this.reactionsRepo.remove(reaction);
    return { ok: true };
  }
}
