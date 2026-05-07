import { Controller, Get, NotFoundException, Param, Post, Query, UseGuards } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { AdminOnlyGuard } from "../auth/roles.guard";
import { ThreadEntity, type ThreadStatus } from "../../persistence/entities/thread.entity";

@ApiTags("admin")
@ApiBearerAuth()
@Controller("api/admin/threads")
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
export class AdminThreadsController {
  constructor(@InjectRepository(ThreadEntity) private readonly threadsRepo: Repository<ThreadEntity>) {}

  @Get()
  async list(@Query("status") status?: ThreadStatus, @Query("q") q?: string, @Query("category") category?: string) {
    const qb = this.threadsRepo.createQueryBuilder("t").leftJoinAndSelect("t.author", "author");
    if (status) qb.where("t.status = :status", { status });
    if (q) qb.andWhere("LOWER(t.title) LIKE :q", { q: `%${q.toLowerCase()}%` });
    if (category) qb.andWhere("t.category = :category", { category });
    qb.orderBy("t.createdAt", "DESC");
    const items = await qb.getMany();
    return {
      items: items.map((t) => ({
        id: t.id,
        title: t.title,
        excerpt: t.excerpt,
        category: t.category,
        tags: t.tags ?? [],
        status: t.status,
        createdAt: t.createdAt,
        author: { id: t.author.id, displayName: t.author.name, avatarUrl: t.author.avatarUrl },
      })),
      nextCursor: null,
    };
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const t = await this.threadsRepo.findOne({
      where: { id },
      relations: { attachments: true },
    });
    if (!t) throw new NotFoundException("Thread not found");
    return {
      id: t.id,
      title: t.title,
      content: t.content,
      excerpt: t.excerpt,
      category: t.category,
      tags: t.tags ?? [],
      status: t.status,
      counts: { repliesCount: t.repliesCount, viewsCount: t.viewsCount, likesCount: t.likesCount },
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      author: { id: t.author.id, displayName: t.author.name, avatarUrl: t.author.avatarUrl },
      attachments: (t.attachments ?? []).map((a) => ({
        id: a.id,
        url: a.url,
        mimeType: a.mimeType,
        sizeBytes: a.sizeBytes,
      })),
    };
  }

  @Post(":id/approve")
  async approve(@Param("id") id: string) {
    const thread = await this.threadsRepo.findOne({ where: { id } });
    if (!thread) return { id, status: "rejected" as const };
    thread.status = "approved";
    thread.approvedAt = new Date();
    thread.rejectedAt = null;
    const saved = await this.threadsRepo.save(thread);
    return { id: saved.id, status: saved.status };
  }

  @Post(":id/reject")
  async reject(@Param("id") id: string) {
    const thread = await this.threadsRepo.findOne({ where: { id } });
    if (!thread) return { id, status: "rejected" as const };
    thread.status = "rejected";
    thread.rejectedAt = new Date();
    thread.approvedAt = null;
    const saved = await this.threadsRepo.save(thread);
    return { id: saved.id, status: saved.status };
  }
}

