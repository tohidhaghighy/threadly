import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ReplyEntity } from "../../persistence/entities/reply.entity";
import { ThreadEntity } from "../../persistence/entities/thread.entity";
import { UsersService } from "../users/users.service";

@Injectable()
export class RepliesService {
  constructor(
    @InjectRepository(ReplyEntity) private readonly repliesRepo: Repository<ReplyEntity>,
    @InjectRepository(ThreadEntity) private readonly threadsRepo: Repository<ThreadEntity>,
    private readonly users: UsersService,
  ) {}

  async list(threadId: string) {
    const items = await this.repliesRepo.find({
      where: { thread: { id: threadId } },
      order: { createdAt: "ASC" },
    });
    return {
      items: items.map((r) => ({
        id: r.id,
        threadId,
        author: { id: r.author.id, displayName: r.author.name, avatarUrl: r.author.avatarUrl },
        content: r.content,
        createdAt: r.createdAt,
        likesCount: r.likesCount,
      })),
      nextCursor: null,
    };
  }

  async create(threadId: string, input: { authorId: string; content: string }) {
    const thread = await this.threadsRepo.findOne({ where: { id: threadId } });
    if (!thread || thread.status !== "approved") throw new NotFoundException("Thread not found");
    const author = await this.users.findById(input.authorId);

    const entity = this.repliesRepo.create({ thread, author, content: input.content, likesCount: 0 });
    const saved = await this.repliesRepo.save(entity);

    thread.repliesCount += 1;
    await this.threadsRepo.save(thread);

    return { id: saved.id };
  }
}

