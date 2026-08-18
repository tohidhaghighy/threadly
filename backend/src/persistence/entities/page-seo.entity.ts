import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("page_seo")
export class PageSeoEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "nvarchar", length: 40 })
  pageKey!: string;

  @Column({ type: "nvarchar", length: 80 })
  label!: string;

  @Column({ type: "nvarchar", length: 120 })
  path!: string;

  /** Appended with site name when titleAbsolute is null. */
  @Column({ type: "nvarchar", length: 120, nullable: true })
  title!: string | null;

  /** Full document title (no site suffix). */
  @Column({ type: "nvarchar", length: 160, nullable: true })
  titleAbsolute!: string | null;

  @Column({ type: "nvarchar", length: 512 })
  description!: string;

  @Column({ type: "simple-json", default: "[]" })
  keywords!: string[];

  @Column({ type: "bit", default: false })
  noindex!: boolean;

  /** Long crawlable intro shown above the footer on the home page. */
  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  footerBlurb!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
