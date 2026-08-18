import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from "./user.entity";
import { ThreadEntity } from "./thread.entity";

@Entity("replies")
export class ReplyEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => ThreadEntity, (t) => t.replies, { onDelete: "CASCADE" })
  thread!: ThreadEntity;

  @ManyToOne(() => UserEntity, (u) => u.replies, { eager: true })
  author!: UserEntity;

  @Column({ type: "nvarchar", length: "MAX" })
  content!: string;

  @Column({ type: "int", default: 0 })
  likesCount!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
