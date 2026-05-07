import { Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { UserEntity } from "./user.entity";
import { ThreadEntity } from "./thread.entity";

@Entity("thread_likes")
@Unique(["thread", "user"])
export class ThreadLikeEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => ThreadEntity, { onDelete: "CASCADE" })
  thread!: ThreadEntity;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  user!: UserEntity;
}

