import { Controller, Delete, Get, NotFoundException, Param, Post, Query, UseGuards } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { ApiBearerAuth, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { AdminOnlyGuard } from "../auth/roles.guard";
import { ThreadEntity, type ThreadStatus } from "../../persistence/entities/thread.entity";
import { ReplyEntity } from "../../persistence/entities/reply.entity";
import { ReplyLikeEntity } from "../../persistence/entities/reply-like.entity";
import { ReplyReactionEntity } from "../../persistence/entities/reply-reaction.entity";
import { ReplyAttachmentEntity } from "../../persistence/entities/reply-attachment.entity";
import { AttachmentEntity } from "../../persistence/entities/attachment.entity";
import { ThreadLikeEntity } from "../../persistence/entities/thread-like.entity";
import { ThreadViewEntity } from "../../persistence/entities/thread-view.entity";

@ApiTags("admin")
@ApiBearerAuth()
@Controller("api/admin/threads")
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
export class AdminThreadsController {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ThreadEntity) private readonly threadsRepo: Repository<ThreadEntity>,
  ) {}

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

  @Delete(":id")
  @ApiResponse({ status: 200, schema: { example: { ok: true } } })
  async remove(@Param("id") id: string) {
    return this.dataSource.transaction(async (manager) => {
      const threadRepo = manager.getRepository(ThreadEntity);
      const replyRepo = manager.getRepository(ReplyEntity);
      const replyLikeRepo = manager.getRepository(ReplyLikeEntity);
      const replyReactionRepo = manager.getRepository(ReplyReactionEntity);
      const replyAttachmentRepo = manager.getRepository(ReplyAttachmentEntity);
      const attachmentRepo = manager.getRepository(AttachmentEntity);
      const threadLikeRepo = manager.getRepository(ThreadLikeEntity);
      const threadViewRepo = manager.getRepository(ThreadViewEntity);

      const thread = await threadRepo.findOne({ where: { id } });
      if (!thread) throw new NotFoundException("Thread not found");

      const replies = await replyRepo.find({ where: { thread: { id } }, select: ["id"] });
      const replyIds = replies.map((r) => r.id);

      if (replyIds.length) {
        await replyAttachmentRepo
          .createQueryBuilder()
          .delete()
          .where("replyId IN (:...ids)", { ids: replyIds })
          .execute();
        await replyLikeRepo.createQueryBuilder().delete().where("replyId IN (:...ids)", { ids: replyIds }).execute();
        await replyReactionRepo
          .createQueryBuilder()
          .delete()
          .where("replyId IN (:...ids)", { ids: replyIds })
          .execute();
        await replyRepo.createQueryBuilder().delete().where("id IN (:...ids)", { ids: replyIds }).execute();
      }

      await attachmentRepo.createQueryBuilder().delete().where("threadId = :id", { id }).execute();
      await threadLikeRepo.createQueryBuilder().delete().where("threadId = :id", { id }).execute();
      await threadViewRepo.createQueryBuilder().delete().where("threadId = :id", { id }).execute();

      thread.bestReplyId = null;
      await threadRepo.save(thread);
      await threadRepo.delete(id);

      return { ok: true };
    });
  }
}
