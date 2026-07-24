import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("page_seo")
export class PageSeoEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 40 })
  pageKey!: string;

  @Column({ type: "varchar", length: 80 })
  label!: string;

  @Column({ type: "varchar", length: 120 })
  path!: string;

  /** Appended with site name when titleAbsolute is null. */
  @Column({ type: "varchar", length: 120, nullable: true })
  title!: string | null;

  /** Full document title (no site suffix). */
  @Column({ type: "varchar", length: 160, nullable: true })
  titleAbsolute!: string | null;

  @Column({ type: "varchar", length: 512 })
  description!: string;

  @Column({ type: "simple-json", default: "[]" })
  keywords!: string[];

  @Column({ type: "boolean", default: false })
  noindex!: boolean;

  /** Long crawlable intro shown above the footer on the home page. */
  @Column({ type: "text", nullable: true })
  footerBlurb!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
