import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ThreadEntity } from "./thread.entity";
import { UserEntity } from "./user.entity";

@Entity("attachments")
export class AttachmentEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => ThreadEntity, (t) => t.attachments, { onDelete: "CASCADE" })
  thread!: ThreadEntity;

  @ManyToOne(() => UserEntity, { eager: true })
  uploader!: UserEntity;

  @Column({ type: "nvarchar", length: 255 })
  originalFileName!: string;

  @Column({ type: "nvarchar", length: 80 })
  mimeType!: string;

  @Column({ type: "int" })
  sizeBytes!: number;

  @Column({ type: "nvarchar", length: 600 })
  url!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
