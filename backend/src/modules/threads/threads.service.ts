import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { ThreadEntity, type ThreadStatus } from "../../persistence/entities/thread.entity";
import { UsersService } from "../users/users.service";
import { ThreadLikeEntity } from "../../persistence/entities/thread-like.entity";
import { ThreadViewEntity } from "../../persistence/entities/thread-view.entity";
import { ReplyEntity } from "../../persistence/entities/reply.entity";

function makeExcerpt(content: string) {
  const trimmed = content.trim();
  return trimmed.length > 160 ? trimmed.slice(0, 160) + "..." : trimmed;
}

@Injectable()
export class ThreadsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ThreadEntity) private readonly threadsRepo: Repository<ThreadEntity>,
    @InjectRepository(ReplyEntity) private readonly repliesRepo: Repository<ReplyEntity>,
    @InjectRepository(ThreadLikeEntity) private readonly likesRepo: Repository<ThreadLikeEntity>,
    @InjectRepository(ThreadViewEntity) private readonly viewsRepo: Repository<ThreadViewEntity>,
    private readonly users: UsersService,
  ) {}

  async categoryCounts() {
    const rows = await this.threadsRepo
      .createQueryBuilder("t")
      .select("t.category", "category")
      .addSelect("COUNT(1)", "count")
      .where("t.status = :status", { status: "approved" satisfies ThreadStatus })
      .groupBy("t.category")
      .getRawMany<{ category: string; count: string }>();

    return {
      items: rows
        .filter((r) => !!r.category)
        .map((r) => ({ category: r.category, count: Number(r.count) || 0 }))
        .sort((a, b) => b.count - a.count),
    };
  }

  async tagsCatalog(query?: { category?: string; limit?: string }) {
    const qb = this.threadsRepo.createQueryBuilder("t");
    qb.select("t.tags", "tags");
    qb.where("t.status = :status", { status: "approved" satisfies ThreadStatus });
    if (query?.category) qb.andWhere("t.category = :category", { category: query.category });

    // We just need a sample of rows to build a tag frequency map.
    // Keep it bounded to avoid scanning too much on large datasets.
    const take = Math.min(Math.max(Number(query?.limit ?? "200") || 200, 1), 1000);
    qb.orderBy("t.createdAt", "DESC").take(take);

    const rows = await qb.getRawMany<{ tags: string[] | null }>();

    const freq = new Map<string, number>();
    for (const r of rows) {
      const tags = (r.tags ?? []) as unknown as string[];
      for (const raw of tags) {
        const tag = String(raw ?? "").trim().toLowerCase();
        if (!tag) continue;
        freq.set(tag, (freq.get(tag) ?? 0) + 1);
      }
    }

    const items = Array.from(freq.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

    return { items };
  }

  async listPublic(query?: { category?: string; q?: string; sort?: string; lang?: "fa" | "en"; cursor?: string; limit?: string }) {
    const qb = this.threadsRepo.createQueryBuilder("t").leftJoinAndSelect("t.author", "author");
    qb.where("t.status = :status", { status: "approved" satisfies ThreadStatus });
    if (query?.category) qb.andWhere("t.category = :category", { category: query.category });
    if (query?.lang) qb.andWhere("t.language = :lang", { lang: query.lang });
    if (query?.q) qb.andWhere("LOWER(t.title) LIKE :q", { q: `%${query.q.toLowerCase()}%` });

    const sort = query?.sort ?? "new";
    if (sort === "hot") qb.orderBy("t.viewsCount", "DESC");
    else if (sort === "top") qb.orderBy("t.likesCount", "DESC");
    else if (sort === "replies") qb.orderBy("t.repliesCount", "DESC");
    else qb.orderBy("t.createdAt", "DESC");

    const take = Math.min(Math.max(Number(query?.limit ?? "10") || 10, 1), 50);
    const skip = Math.max(Number(query?.cursor ?? "0") || 0, 0);
    qb.take(take + 1).skip(skip);

    const items = await qb.getMany();
    const hasMore = items.length > take;
    const pageItems = hasMore ? items.slice(0, take) : items;

    return {
      items: pageItems.map((t) => this.publicThreadListItem(t)),
      nextCursor: hasMore ? String(skip + take) : null,
    };
  }

  async getPublic(id: string, viewerUserId?: string) {
    const t = await this.threadsRepo.findOne({
      where: { id },
      relations: { attachments: true },
    });
    if (!t || t.status !== "approved") throw new NotFoundException("Thread not found");
    const likedByMe = viewerUserId
      ? !!(await this.likesRepo.findOne({
          where: { thread: { id }, user: { id: viewerUserId } },
        }))
      : false;
    return this.publicThreadDetail(t, { likedByMe });
  }

  async createPending(input: { authorId: string; title: string; content: string; category: string; tags: string[]; language?: "fa" | "en" }) {
    const author = await this.users.findById(input.authorId);
    const entity = this.threadsRepo.create({
      title: input.title,
      content: input.content,
      excerpt: makeExcerpt(input.content),
      category: input.category,
      tags: input.tags,
      status: "pending",
      language: input.language ?? null,
      author,
    });
    const saved = await this.threadsRepo.save(entity);
    return { id: saved.id, status: saved.status };
  }

  publicThreadListItem(t: ThreadEntity) {
    return {
      id: t.id,
      title: t.title,
      excerpt: t.excerpt,
      category: t.category,
      tags: t.tags ?? [],
      author: { id: t.author.id, displayName: t.author.name, avatarUrl: t.author.avatarUrl },
      status: t.status,
      counts: { repliesCount: t.repliesCount, viewsCount: t.viewsCount, likesCount: t.likesCount },
      createdAt: t.createdAt,
      lastActivityAt: t.updatedAt,
    };
  }

  publicThreadDetail(t: ThreadEntity, extras?: { likedByMe?: boolean }) {
    return {
      id: t.id,
      title: t.title,
      content: t.content,
      excerpt: t.excerpt,
      category: t.category,
      tags: t.tags ?? [],
      author: { id: t.author.id, displayName: t.author.name, avatarUrl: t.author.avatarUrl },
      status: t.status,
      counts: { repliesCount: t.repliesCount, viewsCount: t.viewsCount, likesCount: t.likesCount },
      bestReplyId: t.bestReplyId ?? null,
      likedByMe: extras?.likedByMe ?? false,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      attachments: (t.attachments ?? []).map((a) => ({
        id: a.id,
        url: a.url,
        mimeType: a.mimeType,
        sizeBytes: a.sizeBytes,
      })),
    };
  }

  async toggleLike(threadId: string, userId: string) {
    return this.dataSource.transaction(async (manager) => {
      const threadRepo = manager.getRepository(ThreadEntity);
      const likeRepo = manager.getRepository(ThreadLikeEntity);

      const thread = await threadRepo.findOne({ where: { id: threadId } });
      if (!thread || thread.status !== "approved") throw new NotFoundException("Thread not found");

      const user = await this.users.findById(userId);

      const existing = await likeRepo.findOne({
        where: { thread: { id: threadId }, user: { id: userId } },
      });

      if (existing) {
        await likeRepo.remove(existing);
        thread.likesCount = Math.max(0, thread.likesCount - 1);
        await threadRepo.save(thread);
        return { likesCount: thread.likesCount, likedByMe: false };
      }

      await likeRepo.save(likeRepo.create({ thread, user }));
      thread.likesCount += 1;
      await threadRepo.save(thread);
      return { likesCount: thread.likesCount, likedByMe: true };
    });
  }

  async setBestReply(threadId: string, replyId: string, actorUserId: string) {
    const thread = await this.threadsRepo.findOne({ where: { id: threadId } });
    if (!thread || thread.status !== "approved") throw new NotFoundException("Thread not found");

    const actor = await this.users.findById(actorUserId);
    const canModerateAsAdmin = actor.role === "admin";
    if (thread.author.id !== actorUserId && !canModerateAsAdmin) {
      throw new ForbiddenException("Only the thread owner or admin can choose the best answer");
    }

    const reply = await this.repliesRepo.findOne({ where: { id: replyId, thread: { id: threadId } } });
    if (!reply) throw new NotFoundException("Reply not found");

    // Selecting the same reply again unsets the best answer.
    thread.bestReplyId = thread.bestReplyId === replyId ? null : reply.id;
    await this.threadsRepo.save(thread);
    return { bestReplyId: thread.bestReplyId };
  }

  async recordView(threadId: string, viewerUserId?: string) {
    if (!viewerUserId) {
      const thread = await this.threadsRepo.findOne({ where: { id: threadId } });
      if (!thread || thread.status !== "approved") throw new NotFoundException("Thread not found");
      thread.viewsCount += 1;
      await this.threadsRepo.save(thread);
      return { viewsCount: thread.viewsCount };
    }

    return this.dataSource.transaction(async (manager) => {
      const threadRepo = manager.getRepository(ThreadEntity);
      const viewRepo = manager.getRepository(ThreadViewEntity);

      const thread = await threadRepo.findOne({ where: { id: threadId } });
      if (!thread || thread.status !== "approved") throw new NotFoundException("Thread not found");

      // Keep a record that this user has viewed this thread at least once,
      // but still increment the view counter on every open (requested behavior).
      const existing = await viewRepo.findOne({
        where: { thread: { id: threadId }, user: { id: viewerUserId } },
      });
      if (!existing) {
        const user = await this.users.findById(viewerUserId);
        await viewRepo.save(viewRepo.create({ thread, user }));
      }
      thread.viewsCount += 1;
      await threadRepo.save(thread);
      return { viewsCount: thread.viewsCount };
    });
  }
}

