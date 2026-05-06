import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserEntity } from "./user.entity";
import { ReplyEntity } from "./reply.entity";
import { AttachmentEntity } from "./attachment.entity";

export type ThreadStatus = "pending" | "approved" | "rejected";

@Entity("threads")
export class ThreadEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar", length: 240 })
  title!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "text" })
  excerpt!: string;

  @Index()
  @Column({ type: "varchar", length: 80 })
  category!: string;

  @Column({ type: "simple-json", default: "[]" })
  tags!: string[];

  @Index()
  @Column({ type: "varchar", length: 20, default: "pending" })
  status!: ThreadStatus;

  @Column({ type: "varchar", length: 10, nullable: true })
  language!: "fa" | "en" | null;

  @Column({ type: "int", default: 0 })
  repliesCount!: number;

  @Column({ type: "int", default: 0 })
  viewsCount!: number;

  @Column({ type: "int", default: 0 })
  likesCount!: number;

  @ManyToOne(() => UserEntity, (u) => u.threads, { eager: true })
  author!: UserEntity;

  @OneToMany(() => ReplyEntity, (r) => r.thread)
  replies!: ReplyEntity[];

  @OneToMany(() => AttachmentEntity, (a) => a.thread)
  attachments!: AttachmentEntity[];

  @Column({ type: "datetime", nullable: true })
  approvedAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  rejectedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

