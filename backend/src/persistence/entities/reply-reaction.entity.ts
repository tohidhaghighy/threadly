import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { UserEntity } from "./user.entity";
import { ReplyEntity } from "./reply.entity";

@Entity("reply_reactions")
@Unique(["reply", "user", "emoji"])
export class ReplyReactionEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => ReplyEntity, { onDelete: "CASCADE" })
  reply!: ReplyEntity;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  user!: UserEntity;

  @Column({ type: "nvarchar", length: 32, collation: "Latin1_General_100_CI_AS_SC" })
  emoji!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
