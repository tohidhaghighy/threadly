import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ReplyEntity } from "./reply.entity";
import { UserEntity } from "./user.entity";

@Entity("reply_attachments")
export class ReplyAttachmentEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => ReplyEntity, { onDelete: "CASCADE" })
  reply!: ReplyEntity;

  @ManyToOne(() => UserEntity, { eager: true })
  uploader!: UserEntity;

  @Column({ type: "varchar", length: 255 })
  originalFileName!: string;

  @Column({ type: "varchar", length: 80 })
  mimeType!: string;

  @Column({ type: "int" })
  sizeBytes!: number;

  @Column({ type: "varchar", length: 600 })
  url!: string;

  @CreateDateColumn()
  createdAt!: Date;
}

