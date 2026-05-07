import { Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { UserEntity } from "./user.entity";
import { ReplyEntity } from "./reply.entity";

@Entity("reply_likes")
@Unique(["reply", "user"])
export class ReplyLikeEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => ReplyEntity, { onDelete: "CASCADE" })
  reply!: ReplyEntity;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  user!: UserEntity;
}
