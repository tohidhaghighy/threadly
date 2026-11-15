import { CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from "./user.entity";

@Entity("user_follows")
@Index("UQ_user_follows_pair", ["follower", "following"], { unique: true })
export class UserFollowEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => UserEntity, { onDelete: "NO ACTION" })
  @JoinColumn({ name: "followerId" })
  follower!: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: "NO ACTION" })
  @JoinColumn({ name: "followingId" })
  following!: UserEntity;

  @CreateDateColumn()
  createdAt!: Date;
}
