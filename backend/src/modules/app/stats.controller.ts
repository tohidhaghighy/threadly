import { Controller, Get } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Repository } from "typeorm";

import { UserEntity } from "../../persistence/entities/user.entity";
import { ThreadEntity, type ThreadStatus } from "../../persistence/entities/thread.entity";

@ApiTags("stats")
@Controller("api/stats")
export class StatsController {
  constructor(
    @InjectRepository(UserEntity) private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(ThreadEntity) private readonly threadsRepo: Repository<ThreadEntity>,
  ) {}

  @Get()
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        approvedThreadsCount: 123,
        usersCount: 45,
        responseRatePercent: 87,
      },
    },
  })
  async getStats() {
    const approvedThreadsCount = await this.threadsRepo.count({
      where: { status: "approved" satisfies ThreadStatus },
    });

    const repliedThreadsCount = await this.threadsRepo
      .createQueryBuilder("t")
      .where("t.status = :status", { status: "approved" satisfies ThreadStatus })
      .andWhere("t.repliesCount > 0")
      .getCount();

    const usersCount = await this.usersRepo.count();

    const responseRatePercent =
      approvedThreadsCount > 0 ? Math.round((repliedThreadsCount / approvedThreadsCount) * 100) : 0;

    return {
      approvedThreadsCount,
      usersCount,
      responseRatePercent,
    };
  }
}

