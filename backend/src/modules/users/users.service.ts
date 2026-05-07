import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity, type UserRole, type UserStatus } from "../../persistence/entities/user.entity";
import { ThreadEntity } from "../../persistence/entities/thread.entity";
import { ReplyEntity } from "../../persistence/entities/reply.entity";
import { ReplyReactionEntity } from "../../persistence/entities/reply-reaction.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity) private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(ThreadEntity) private readonly threadsRepo: Repository<ThreadEntity>,
    @InjectRepository(ReplyEntity) private readonly repliesRepo: Repository<ReplyEntity>,
    @InjectRepository(ReplyReactionEntity) private readonly reactionsRepo: Repository<ReplyReactionEntity>,
  ) {}

  async findById(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async listAdmin(query?: { q?: string; role?: UserRole; status?: UserStatus }) {
    const qb = this.usersRepo.createQueryBuilder("u");
    if (query?.q) {
      qb.andWhere("(LOWER(u.name) LIKE :q OR LOWER(u.email) LIKE :q)", { q: `%${query.q.toLowerCase()}%` });
    }
    if (query?.role) qb.andWhere("u.role = :role", { role: query.role });
    if (query?.status) qb.andWhere("u.status = :status", { status: query.status });
    qb.orderBy("u.createdAt", "DESC");
    const items = await qb.getMany();
    return {
      items: items.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        joinedAt: u.createdAt,
      })),
      nextCursor: null,
    };
  }

  async setRole(userId: string, role: UserRole) {
    const user = await this.findById(userId);
    user.role = role;
    const saved = await this.usersRepo.save(user);
    return { id: saved.id, role: saved.role };
  }

  async setStatus(userId: string, status: UserStatus) {
    const user = await this.findById(userId);
    user.status = status;
    const saved = await this.usersRepo.save(user);
    return { id: saved.id, status: saved.status };
  }

  private scoreOf(counts: { threads: number; comments: number; reactions: number }) {
    return counts.threads * 10 + counts.comments * 2 + counts.reactions * 1;
  }

  private async activityCountsByUserId(): Promise<Map<string, { threads: number; comments: number; reactions: number }>> {
    const out = new Map<string, { threads: number; comments: number; reactions: number }>();

    // threads (approved only)
    const threadRows = await this.threadsRepo
      .createQueryBuilder("t")
      .leftJoin("t.author", "author")
      .select("author.id", "userId")
      .addSelect("COUNT(1)", "cnt")
      .where("t.status = :status", { status: "approved" })
      .groupBy("author.id")
      .getRawMany<{ userId: string; cnt: string }>();
    for (const r of threadRows) {
      const cur = out.get(r.userId) ?? { threads: 0, comments: 0, reactions: 0 };
      cur.threads = Number(r.cnt) || 0;
      out.set(r.userId, cur);
    }

    // comments/replies (only for approved threads)
    const replyRows = await this.repliesRepo
      .createQueryBuilder("r")
      .leftJoin("r.author", "author")
      .leftJoin("r.thread", "t")
      .select("author.id", "userId")
      .addSelect("COUNT(1)", "cnt")
      .where("t.status = :status", { status: "approved" })
      .groupBy("author.id")
      .getRawMany<{ userId: string; cnt: string }>();
    for (const r of replyRows) {
      const cur = out.get(r.userId) ?? { threads: 0, comments: 0, reactions: 0 };
      cur.comments = Number(r.cnt) || 0;
      out.set(r.userId, cur);
    }

    // reactions (only on replies that belong to approved threads)
    const reactRows = await this.reactionsRepo
      .createQueryBuilder("rr")
      .leftJoin("rr.user", "user")
      .leftJoin("rr.reply", "reply")
      .leftJoin("reply.thread", "t")
      .select("user.id", "userId")
      .addSelect("COUNT(1)", "cnt")
      .where("t.status = :status", { status: "approved" })
      .groupBy("user.id")
      .getRawMany<{ userId: string; cnt: string }>();
    for (const r of reactRows) {
      const cur = out.get(r.userId) ?? { threads: 0, comments: 0, reactions: 0 };
      cur.reactions = Number(r.cnt) || 0;
      out.set(r.userId, cur);
    }

    return out;
  }

  async leaderboard(input?: { limit?: string }) {
    const limit = Math.min(Math.max(Number(input?.limit ?? "50") || 50, 1), 200);
    const users = await this.usersRepo.find({ where: { status: "active" }, order: { createdAt: "ASC" } });
    const counts = await this.activityCountsByUserId();

    const rows = users.map((u) => {
      const breakdown = counts.get(u.id) ?? { threads: 0, comments: 0, reactions: 0 };
      return {
        id: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl,
        points: this.scoreOf(breakdown),
        breakdown,
      };
    });

    rows.sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

    const items = rows.slice(0, limit).map((r, idx) => ({
      ...r,
      rank: idx + 1,
    }));

    return { items, nextCursor: null };
  }

  async profile(userId: string) {
    const user = await this.findById(userId);
    const users = await this.usersRepo.find({ where: { status: "active" }, order: { createdAt: "ASC" } });
    const counts = await this.activityCountsByUserId();

    const rows = users.map((u) => {
      const breakdown = counts.get(u.id) ?? { threads: 0, comments: 0, reactions: 0 };
      return { id: u.id, points: this.scoreOf(breakdown), name: u.name, breakdown, avatarUrl: u.avatarUrl };
    });
    rows.sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

    const rank = Math.max(
      1,
      rows.findIndex((r) => r.id === user.id) + 1,
    );
    const breakdown = counts.get(user.id) ?? { threads: 0, comments: 0, reactions: 0 };
    return {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      points: this.scoreOf(breakdown),
      rank,
      breakdown,
      totalUsers: rows.length,
    };
  }

  async pointsEvents(userId: string, input?: { limit?: string }) {
    await this.findById(userId);

    const limit = Math.min(Math.max(Number(input?.limit ?? "100") || 100, 1), 200);

    const threads = await this.threadsRepo
      .createQueryBuilder("t")
      .leftJoin("t.author", "author")
      .select("t.id", "id")
      .addSelect("t.title", "title")
      .addSelect("t.createdAt", "createdAt")
      .where("author.id = :userId", { userId })
      .andWhere("t.status = :status", { status: "approved" })
      .orderBy("t.createdAt", "DESC")
      .limit(limit)
      .getRawMany<{ id: string; title: string; createdAt: Date }>();

    const replies = await this.repliesRepo
      .createQueryBuilder("r")
      .leftJoin("r.author", "author")
      .leftJoin("r.thread", "t")
      .select("r.id", "id")
      .addSelect("r.content", "content")
      .addSelect("r.createdAt", "createdAt")
      .addSelect("t.id", "threadId")
      .addSelect("t.title", "threadTitle")
      .where("author.id = :userId", { userId })
      .andWhere("t.status = :status", { status: "approved" })
      .orderBy("r.createdAt", "DESC")
      .limit(limit)
      .getRawMany<{ id: string; content: string; createdAt: Date; threadId: string; threadTitle: string }>();

    const reactions = await this.reactionsRepo
      .createQueryBuilder("rr")
      .leftJoin("rr.user", "user")
      .leftJoin("rr.reply", "reply")
      .leftJoin("reply.thread", "t")
      .select("rr.id", "id")
      .addSelect("rr.emoji", "emoji")
      .addSelect("rr.createdAt", "createdAt")
      .addSelect("reply.id", "replyId")
      .addSelect("t.id", "threadId")
      .addSelect("t.title", "threadTitle")
      .where("user.id = :userId", { userId })
      .andWhere("t.status = :status", { status: "approved" })
      .orderBy("rr.createdAt", "DESC")
      .limit(limit)
      .getRawMany<{ id: string; emoji: string; createdAt: Date; replyId: string; threadId: string; threadTitle: string }>();

    const items = [
      ...threads.map((t) => ({
        id: `thread:${t.id}`,
        type: "thread" as const,
        points: 10,
        createdAt: new Date(t.createdAt).toISOString(),
        thread: { id: t.id, title: t.title },
      })),
      ...replies.map((r) => ({
        id: `reply:${r.id}`,
        type: "reply" as const,
        points: 2,
        createdAt: new Date(r.createdAt).toISOString(),
        thread: { id: r.threadId, title: r.threadTitle },
        reply: { id: r.id, excerpt: (r.content ?? "").slice(0, 140) },
      })),
      ...reactions.map((rr) => ({
        id: `reaction:${rr.id}`,
        type: "reaction" as const,
        points: 1,
        createdAt: new Date(rr.createdAt).toISOString(),
        emoji: rr.emoji,
        thread: { id: rr.threadId, title: rr.threadTitle },
        reply: { id: rr.replyId },
      })),
    ];

    items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));

    return { items: items.slice(0, limit), nextCursor: null };
  }

  avatarSamples() {
    const items = Array.from({ length: 8 }).map((_, i) => ({ url: `/uploads/avatars/sample-${i + 1}.svg` }));
    return { items };
  }

  async setAvatarUrl(userId: string, avatarUrl: string | null, opts?: { allowSamplesOnly?: boolean }) {
    const user = await this.findById(userId);

    if (opts?.allowSamplesOnly) {
      if (avatarUrl === null) {
        user.avatarUrl = null;
      } else if (/^\/uploads\/avatars\/sample-\d+\.svg$/.test(avatarUrl)) {
        user.avatarUrl = avatarUrl;
      } else {
        throw new BadRequestException("Invalid sample avatar");
      }
    } else {
      user.avatarUrl = avatarUrl;
    }

    const saved = await this.usersRepo.save(user);
    return { avatarUrl: saved.avatarUrl };
  }
}

