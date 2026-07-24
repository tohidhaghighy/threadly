import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity, type UserRole, type UserStatus } from "../../persistence/entities/user.entity";
import {
  normalizeBankShaba,
  normalizeBirthDate,
  normalizeCardNumber,
  normalizeIranPhone,
  profileContactDto,
} from "../../common/profile-fields.util";
import type { UpdateUserProfileDto } from "./dto";
import { ThreadEntity } from "../../persistence/entities/thread.entity";
import { ReplyEntity } from "../../persistence/entities/reply.entity";
import { ReplyReactionEntity } from "../../persistence/entities/reply-reaction.entity";
import { POINTS, PHONE_REQUIRED_MIN_POINTS, scoreFromCounts } from "../../common/points.constants";

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
    return scoreFromCounts(counts);
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
        points: POINTS.thread,
        createdAt: new Date(t.createdAt).toISOString(),
        thread: { id: t.id, title: t.title },
      })),
      ...replies.map((r) => ({
        id: `reply:${r.id}`,
        type: "reply" as const,
        points: POINTS.reply,
        createdAt: new Date(r.createdAt).toISOString(),
        thread: { id: r.threadId, title: r.threadTitle },
        reply: { id: r.id, excerpt: (r.content ?? "").slice(0, 140) },
      })),
      ...reactions.map((rr) => ({
        id: `reaction:${rr.id}`,
        type: "reaction" as const,
        points: POINTS.reaction,
        createdAt: new Date(rr.createdAt).toISOString(),
        emoji: rr.emoji,
        thread: { id: rr.threadId, title: rr.threadTitle },
        reply: { id: rr.replyId },
      })),
    ];

    items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));

    return { items: items.slice(0, limit), nextCursor: null };
  }

  async alertsForUser(userId: string, input?: { limit?: string }) {
    const user = await this.findById(userId);
    const limit = Math.min(Math.max(Number(input?.limit ?? "20") || 20, 1), 50);
    const lowerName = (user.name ?? "").trim().toLowerCase();
    const mentionNeedle = lowerName ? `@${lowerName}` : "";

    const replyRows = await this.repliesRepo
      .createQueryBuilder("r")
      .leftJoin("r.thread", "t")
      .leftJoin("r.author", "author")
      .leftJoin("t.author", "threadAuthor")
      .select("r.id", "replyId")
      .addSelect("r.content", "content")
      .addSelect("r.createdAt", "createdAt")
      .addSelect("t.id", "threadId")
      .addSelect("t.title", "threadTitle")
      .addSelect("threadAuthor.id", "threadAuthorId")
      .addSelect("author.id", "actorId")
      .addSelect("author.name", "actorName")
      .addSelect("author.avatarUrl", "actorAvatarUrl")
      .where("t.status = :status", { status: "approved" })
      .andWhere("author.id != :userId", { userId })
      .andWhere("(threadAuthor.id = :userId OR LOWER(r.content) LIKE :mentionLike)", {
        userId,
        mentionLike: mentionNeedle ? `%${mentionNeedle}%` : "%@@__never__match__@@%",
      })
      .orderBy("r.createdAt", "DESC")
      .limit(limit * 8)
      .getRawMany<{
        replyId: string;
        content: string;
        createdAt: Date;
        threadId: string;
        threadTitle: string;
        threadAuthorId: string;
        actorId: string;
        actorName: string;
        actorAvatarUrl: string | null;
      }>();

    const replyAlerts = new Map<
      string,
      {
        id: string;
        type: "reply" | "mention";
        createdAt: string;
        message: string;
        thread: { id: string; title: string };
        reply: { id: string; excerpt: string };
        actor: { id: string; name: string; avatarUrl: string | null };
      }
    >();

    for (const row of replyRows) {
      const content = row.content ?? "";
      const isMention = mentionNeedle ? content.toLowerCase().includes(mentionNeedle) : false;
      const type: "reply" | "mention" = isMention ? "mention" : "reply";
      const message =
        type === "mention" ? `${row.actorName} از شما منشن کرد.` : `${row.actorName} به موضوع شما پاسخ داد.`;
      const id = `${type}:${row.replyId}`;
      if (replyAlerts.has(id)) continue;
      replyAlerts.set(id, {
        id,
        type,
        createdAt: new Date(row.createdAt).toISOString(),
        message,
        thread: { id: row.threadId, title: row.threadTitle },
        reply: { id: row.replyId, excerpt: content.slice(0, 160) },
        actor: { id: row.actorId, name: row.actorName, avatarUrl: row.actorAvatarUrl ?? null },
      });
    }

    const threadRows = await this.threadsRepo
      .createQueryBuilder("t")
      .leftJoin("t.author", "author")
      .select("t.id", "id")
      .addSelect("t.title", "title")
      .addSelect("t.updatedAt", "updatedAt")
      .addSelect("t.repliesCount", "repliesCount")
      .addSelect("t.likesCount", "likesCount")
      .where("author.id = :userId", { userId })
      .andWhere("t.status = :status", { status: "approved" })
      .andWhere("(t.repliesCount > 0 OR t.likesCount > 0)")
      .orderBy("t.updatedAt", "DESC")
      .limit(limit * 2)
      .getRawMany<{ id: string; title: string; updatedAt: Date; repliesCount: string; likesCount: string }>();

    const activityAlerts = threadRows.map((row) => ({
      id: `thread-activity:${row.id}`,
      type: "thread_activity" as const,
      createdAt: new Date(row.updatedAt).toISOString(),
      message: `موضوع شما ${Number(row.repliesCount) || 0} پاسخ و ${Number(row.likesCount) || 0} لایک دارد.`,
      thread: { id: row.id, title: row.title },
    }));

    const items = [...replyAlerts.values(), ...activityAlerts]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
      .slice(0, limit);

    return { items, nextCursor: null };
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

  async updateMyProfile(userId: string, dto: UpdateUserProfileDto) {
    const user = await this.findById(userId);

    if (dto.phone !== undefined) user.phone = normalizeIranPhone(dto.phone);
    if (dto.bankShaba !== undefined) user.bankShaba = normalizeBankShaba(dto.bankShaba);
    if (dto.cardNumber !== undefined) user.cardNumber = normalizeCardNumber(dto.cardNumber);
    if (dto.birthDate !== undefined) user.birthDate = normalizeBirthDate(dto.birthDate);

    const counts = await this.activityCountsByUserId();
    const points = this.scoreOf(counts.get(userId) ?? { threads: 0, comments: 0, reactions: 0 });
    if (points >= PHONE_REQUIRED_MIN_POINTS && !user.phone) {
      throw new BadRequestException(
        "از سطح ۴ به بعد، شماره موبایل الزامی است تا پشتیبانی بتواند برای جوایز یا تماس با شما ارتباط بگیرد.",
      );
    }

    const saved = await this.usersRepo.save(user);
    return profileContactDto(saved);
  }
}

