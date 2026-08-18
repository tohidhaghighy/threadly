import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ThreadEntity } from "./thread.entity";
import { ReplyEntity } from "./reply.entity";

export type UserRole = "user" | "admin";
export type UserStatus = "active" | "banned";

@Entity("users")
export class UserEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "nvarchar", length: 120 })
  name!: string;

  @Column({ type: "nvarchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "nvarchar", length: 255 })
  passwordHash!: string;

  @Column({ type: "nvarchar", length: 20, default: "user" })
  role!: UserRole;

  @Column({ type: "nvarchar", length: 20, default: "active" })
  status!: UserStatus;

  @Column({ type: "nvarchar", length: 512, nullable: true })
  avatarUrl!: string | null;

  @Column({ type: "nvarchar", length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: "nvarchar", length: 26, nullable: true })
  bankShaba!: string | null;

  @Column({ type: "nvarchar", length: 16, nullable: true })
  cardNumber!: string | null;

  @Column({ type: "nvarchar", length: 10, nullable: true })
  birthDate!: string | null;

  /**
   * How many of the user's replies were deleted by admins.
   * Used for auto-moderation (ban after repeated removals).
   */
  @Column({ type: "int", default: 0 })
  adminDeletedRepliesCount!: number;

  @OneToMany(() => ThreadEntity, (t) => t.author)
  threads!: ThreadEntity[];

  @OneToMany(() => ReplyEntity, (r) => r.author)
  replies!: ReplyEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
