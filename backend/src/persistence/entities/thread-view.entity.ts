import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { UserEntity } from "./user.entity";
import { ThreadEntity } from "./thread.entity";

@Entity("thread_views")
@Unique(["thread", "user"])
export class ThreadViewEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => ThreadEntity, { onDelete: "CASCADE" })
  thread!: ThreadEntity;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  user!: UserEntity;

  @CreateDateColumn()
  createdAt!: Date;
}

