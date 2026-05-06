import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ThreadEntity, type ThreadStatus } from "../../persistence/entities/thread.entity";
import { UsersService } from "../users/users.service";

function makeExcerpt(content: string) {
  const trimmed = content.trim();
  return trimmed.length > 160 ? trimmed.slice(0, 160) + "..." : trimmed;
}

@Injectable()
export class ThreadsService {
  constructor(
    @InjectRepository(ThreadEntity) private readonly threadsRepo: Repository<ThreadEntity>,
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

  async getPublic(id: string) {
    const t = await this.threadsRepo.findOne({
      where: { id },
      relations: { attachments: true },
    });
    if (!t || t.status !== "approved") throw new NotFoundException("Thread not found");
    return this.publicThreadDetail(t);
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

  publicThreadDetail(t: ThreadEntity) {
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
}

