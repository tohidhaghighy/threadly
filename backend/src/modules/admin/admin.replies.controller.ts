import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from "@nestjs/swagger";
import { DataSource, Repository } from "typeorm";

import { JwtAuthGuard } from "../auth/jwt.guard";
import { AdminOnlyGuard } from "../auth/roles.guard";
import { ReplyEntity } from "../../persistence/entities/reply.entity";
import { ThreadEntity } from "../../persistence/entities/thread.entity";
import { UserEntity } from "../../persistence/entities/user.entity";

@ApiTags("admin")
@ApiBearerAuth()
@Controller("api/admin/replies")
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
export class AdminRepliesController {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ReplyEntity) private readonly repliesRepo: Repository<ReplyEntity>,
    @InjectRepository(ThreadEntity) private readonly threadsRepo: Repository<ThreadEntity>,
  ) {}

  @Patch(":id")
  @ApiBody({ schema: { example: { content: "متن جدید کامنت" } } })
  @ApiResponse({ status: 200, schema: { example: { id: "uuid", content: "متن جدید کامنت" } } })
  async update(@Param("id") id: string, @Body() dto: { content?: string }) {
    const content = (dto.content ?? "").trim();
    if (!content) {
      return { id, content: "" };
    }

    const reply = await this.repliesRepo.findOne({ where: { id } });
    if (!reply) throw new NotFoundException("Reply not found");

    reply.content = content;
    const saved = await this.repliesRepo.save(reply);
    return { id: saved.id, content: saved.content };
  }

  @Delete(":id")
  @ApiResponse({ status: 200, schema: { example: { ok: true } } })
  async remove(@Param("id") id: string) {
    return this.dataSource.transaction(async (manager) => {
      const replyRepo = manager.getRepository(ReplyEntity);
      const threadRepo = manager.getRepository(ThreadEntity);
      const userRepo = manager.getRepository(UserEntity);

      const reply = await replyRepo.findOne({ where: { id }, relations: { thread: true, author: true } });
      if (!reply) throw new NotFoundException("Reply not found");

      const threadId = reply.thread?.id;
      const authorId = reply.author?.id;
      await replyRepo.remove(reply);

      if (threadId) {
        const thread = await threadRepo.findOne({ where: { id: threadId } });
        if (thread) {
          thread.repliesCount = Math.max(0, thread.repliesCount - 1);
          await threadRepo.save(thread);
        }
      }

      // auto moderation: ban a user after 5+ admin-deleted replies
      if (authorId) {
        const author = await userRepo.findOne({ where: { id: authorId } });
        if (author) {
          author.adminDeletedRepliesCount = (author.adminDeletedRepliesCount ?? 0) + 1;
          if (author.adminDeletedRepliesCount >= 5) {
            author.status = "banned";
          }
          await userRepo.save(author);
        }
      }

      return { ok: true };
    });
  }

  @ApiResponse({
    status: 200,
    schema: {
      example: {
        items: [
          {
            id: "uuid",
            content: "متن کامنت",
            createdAt: "2026-05-07T00:00:00.000Z",
            author: { id: "uuid", displayName: "علی" },
            thread: { id: "uuid", title: "عنوان موضوع" },
          },
        ],
        nextCursor: null,
      },
    },
  })
  @Get()
  async list(@Query("threadId") threadId?: string, @Query("threadQ") threadQ?: string, @Query("q") q?: string) {
    const qb = this.repliesRepo
      .createQueryBuilder("r")
      .leftJoinAndSelect("r.author", "author")
      .leftJoinAndSelect("r.thread", "thread");

    if (threadId) qb.where("thread.id = :threadId", { threadId });
    if (threadQ) qb.andWhere("LOWER(thread.title) LIKE :tq", { tq: `%${threadQ.toLowerCase()}%` });
    if (q) qb.andWhere("LOWER(r.content) LIKE :q", { q: `%${q.toLowerCase()}%` });

    qb.orderBy("r.createdAt", "DESC").limit(100);

    const items = await qb.getMany();
    return {
      items: items.map((r) => ({
        id: r.id,
        content: r.content,
        createdAt: r.createdAt,
        author: { id: r.author.id, displayName: r.author.name },
        thread: { id: r.thread.id, title: r.thread.title },
      })),
      nextCursor: null,
    };
  }
}

