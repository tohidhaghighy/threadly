import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("categories")
export class CategoryEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 80 })
  title!: string;

  @Column({ type: "varchar", length: 512, nullable: true })
  description!: string | null;

  @Column({ type: "simple-json", default: "[]" })
  seoKeywords!: string[];

  @Column({ type: "int", default: 0 })
  order!: number;

  @Index()
  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

