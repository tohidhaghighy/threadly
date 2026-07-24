import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { ReplyEntity } from "../../persistence/entities/reply.entity";
import { ThreadEntity } from "../../persistence/entities/thread.entity";
import { ReplyLikeEntity } from "../../persistence/entities/reply-like.entity";
import { ReplyReactionEntity } from "../../persistence/entities/reply-reaction.entity";
import { ReplyAttachmentEntity } from "../../persistence/entities/reply-attachment.entity";
import { UsersService } from "../users/users.service";
import { sanitizeUserHtml, stripHtmlToText } from "../../common/html-sanitize.util";
import type { ReplyReactionEmoji } from "./reply-interactions.constants";

export type ReplyReactionSummary = { emoji: string; count: number; reactedByMe: boolean };

@Injectable()
export class RepliesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ReplyEntity) private readonly repliesRepo: Repository<ReplyEntity>,
    @InjectRepository(ThreadEntity) private readonly threadsRepo: Repository<ThreadEntity>,
    @InjectRepository(ReplyLikeEntity) private readonly likesRepo: Repository<ReplyLikeEntity>,
    @InjectRepository(ReplyReactionEntity) private readonly reactionsRepo: Repository<ReplyReactionEntity>,
    @InjectRepository(ReplyAttachmentEntity) private readonly attachmentsRepo: Repository<ReplyAttachmentEntity>,
    private readonly users: UsersService,
  ) {}

  async list(threadId: string, viewerUserId?: string) {
    const thread = await this.threadsRepo.findOne({ where: { id: threadId } });
    if (!thread || thread.status !== "approved") throw new NotFoundException("Thread not found");
    const bestReplyId = thread.bestReplyId ?? null;

    const items = await this.repliesRepo.find({
      where: { thread: { id: threadId } },
      order: { createdAt: "ASC" },
    });
    const ids = items.map((r) => r.id);
    const { likedByViewer, reactionSummaries } = await this.buildReplyExtras(ids, viewerUserId);

    const atts = ids.length
      ? await this.attachmentsRepo.find({
          where: ids.map((id) => ({ reply: { id } })),
          relations: ["reply"],
        })
      : [];
    const attachmentsByReply = new Map<string, ReplyAttachmentEntity[]>();
    for (const a of atts) {
      const rid = (a.reply as any)?.id as string;
      const arr = attachmentsByReply.get(rid) ?? [];
      arr.push(a);
      attachmentsByReply.set(rid, arr);
    }

    return {
      items: items.map((r) => ({
        id: r.id,
        threadId,
        author: { id: r.author.id, displayName: r.author.name, avatarUrl: r.author.avatarUrl },
        content: r.content,
        createdAt: r.createdAt,
        isBest: bestReplyId === r.id,
        likesCount: r.likesCount,
        likedByMe: viewerUserId ? likedByViewer.has(r.id) : false,
        reactions: reactionSummaries.get(r.id) ?? [],
        attachments: (attachmentsByReply.get(r.id) ?? []).map((a) => ({
          id: a.id,
          url: a.url,
          mimeType: a.mimeType,
          sizeBytes: a.sizeBytes,
        })),
      })),
      nextCursor: null,
    };
  }

  private async buildReplyExtras(
    replyIds: string[],
    viewerId?: string,
  ): Promise<{
    likedByViewer: Set<string>;
    reactionSummaries: Map<string, ReplyReactionSummary[]>;
  }> {
    const likedByViewer = new Set<string>();
    const reactionSummaries = new Map<string, ReplyReactionSummary[]>();

    if (replyIds.length === 0) {
      return { likedByViewer, reactionSummaries };
    }

    if (viewerId) {
      const likes = await this.likesRepo.find({
        where: { user: { id: viewerId }, reply: { id: In(replyIds) } },
        relations: ["reply"],
      });
      for (const l of likes) likedByViewer.add(l.reply.id);
    }

    const rows = await this.reactionsRepo
      .createQueryBuilder("rr")
      .innerJoin("rr.reply", "reply")
      .select("reply.id", "replyId")
      .addSelect("rr.emoji", "emoji")
      .addSelect("COUNT(rr.id)", "cnt")
      .where("reply.id IN (:...ids)", { ids: replyIds })
      .groupBy("reply.id")
      .addGroupBy("rr.emoji")
      .getRawMany<{ replyId: string; emoji: string; cnt: string }>();

    const mineRows = viewerId
      ? await this.reactionsRepo.find({
          where: { user: { id: viewerId }, reply: { id: In(replyIds) } },
          relations: ["reply"],
        })
      : [];
    const mineKey = new Set(mineRows.map((m) => `${m.reply.id}:${m.emoji}`));

    for (const row of rows) {
      const rid = row.replyId;
      const arr = reactionSummaries.get(rid) ?? [];
      arr.push({
        emoji: row.emoji,
        count: Number(row.cnt),
        reactedByMe: mineKey.has(`${rid}:${row.emoji}`),
      });
      reactionSummaries.set(rid, arr);
    }

    for (const [, arr] of reactionSummaries) {
      arr.sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji));
    }

    return { likedByViewer, reactionSummaries };
  }

  async create(threadId: string, input: { authorId: string; content: string }) {
    const thread = await this.threadsRepo.findOne({ where: { id: threadId } });
    if (!thread || thread.status !== "approved") throw new NotFoundException("Thread not found");
    const author = await this.users.findById(input.authorId);

    // Daily limit: regular users can post at most 10 replies/day. Admins are exempt.
    if (author.role !== "admin") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      // TypeORM's Between helper is not imported here; use query builder for a stable date range.
      const rows = await this.repliesRepo
        .createQueryBuilder("r")
        .leftJoin("r.author", "author")
        .select("COUNT(1)", "cnt")
        .where("author.id = :userId", { userId: author.id })
        .andWhere("r.createdAt >= :start", { start })
        .andWhere("r.createdAt < :end", { end })
        .getRawOne<{ cnt: string }>();

      const used = Number(rows?.cnt ?? "0") || 0;
      if (used >= 10) {
        throw new ForbiddenException("You are limited to answer questions (10 per day).");
      }
    }

    const content = sanitizeUserHtml(input.content);
    if (stripHtmlToText(content).length < 2) {
      throw new ForbiddenException("Reply content is too short");
    }

    const entity = this.repliesRepo.create({ thread, author, content, likesCount: 0 });
    const saved = await this.repliesRepo.save(entity);

    thread.repliesCount += 1;
    await this.threadsRepo.save(thread);

    return { id: saved.id };
  }

  async toggleLike(replyId: string, userId: string) {
    return this.dataSource.transaction(async (manager) => {
      const replyRepo = manager.getRepository(ReplyEntity);
      const likeRepo = manager.getRepository(ReplyLikeEntity);

      const reply = await replyRepo.findOne({ where: { id: replyId } });
      if (!reply) throw new NotFoundException("Reply not found");

      const user = await this.users.findById(userId);

      const existing = await likeRepo.findOne({
        where: { reply: { id: replyId }, user: { id: userId } },
      });

      if (existing) {
        await likeRepo.remove(existing);
        reply.likesCount = Math.max(0, reply.likesCount - 1);
        await replyRepo.save(reply);
        return { likesCount: reply.likesCount, likedByMe: false };
      }

      await likeRepo.save(likeRepo.create({ reply, user }));
      reply.likesCount += 1;
      await replyRepo.save(reply);
      return { likesCount: reply.likesCount, likedByMe: true };
    });
  }

  async toggleReaction(replyId: string, userId: string, emoji: ReplyReactionEmoji) {
    const reply = await this.repliesRepo.findOne({ where: { id: replyId } });
    if (!reply) throw new NotFoundException("Reply not found");

    const user = await this.users.findById(userId);

    const existing = await this.reactionsRepo.findOne({
      where: { reply: { id: replyId }, user: { id: userId }, emoji },
    });

    if (existing) {
      await this.reactionsRepo.remove(existing);
    } else {
      await this.reactionsRepo.save(this.reactionsRepo.create({ reply, user, emoji }));
    }

    const reactions = await this.summarizeReactionsForReply(replyId, userId);
    return { reactions };
  }

  private async summarizeReactionsForReply(replyId: string, viewerId: string): Promise<ReplyReactionSummary[]> {
    const rows = await this.reactionsRepo
      .createQueryBuilder("rr")
      .innerJoin("rr.reply", "reply")
      .select("rr.emoji", "emoji")
      .addSelect("COUNT(rr.id)", "cnt")
      .where("reply.id = :id", { id: replyId })
      .groupBy("rr.emoji")
      .getRawMany<{ emoji: string; cnt: string }>();

    const mineRows = await this.reactionsRepo.find({
      where: { reply: { id: replyId }, user: { id: viewerId } },
    });
    const mineEmojis = new Set(mineRows.map((m) => m.emoji));

    const list: ReplyReactionSummary[] = rows.map((row) => ({
      emoji: row.emoji,
      count: Number(row.cnt),
      reactedByMe: mineEmojis.has(row.emoji),
    }));
    list.sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji));
    return list;
  }
}
