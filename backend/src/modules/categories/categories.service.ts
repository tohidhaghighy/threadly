import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CategoryEntity } from "../../persistence/entities/category.entity";
import { ThreadEntity, type ThreadStatus } from "../../persistence/entities/thread.entity";
import { CreateCategoryDto, UpdateCategoryDto } from "./dto";

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity) private readonly categoriesRepo: Repository<CategoryEntity>,
    @InjectRepository(ThreadEntity) private readonly threadsRepo: Repository<ThreadEntity>,
  ) {}

  async listPublic() {
    const cats = await this.categoriesRepo.find({
      where: { isActive: true },
      order: { order: "ASC", title: "ASC" },
    });

    const counts = await this.threadsRepo
      .createQueryBuilder("t")
      .select("t.category", "category")
      .addSelect("COUNT(1)", "count")
      .where("t.status = :status", { status: "approved" satisfies ThreadStatus })
      .groupBy("t.category")
      .getRawMany<{ category: string; count: string }>();
    const countsBy = new Map(counts.map((r) => [r.category, Number(r.count) || 0]));

    return {
      items: cats.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        seoKeywords: c.seoKeywords ?? [],
        order: c.order,
        isActive: c.isActive,
        threadsCount: countsBy.get(c.title) ?? 0,
      })),
    };
  }

  async listAdmin(params?: { q?: string }) {
    const qb = this.categoriesRepo.createQueryBuilder("c");
    if (params?.q) qb.where("LOWER(c.title) LIKE :q", { q: `%${params.q.toLowerCase()}%` });
    qb.orderBy("c.order", "ASC").addOrderBy("c.title", "ASC");
    const cats = await qb.getMany();

    const counts = await this.threadsRepo
      .createQueryBuilder("t")
      .select("t.category", "category")
      .addSelect("COUNT(1)", "count")
      .where("t.status = :status", { status: "approved" satisfies ThreadStatus })
      .groupBy("t.category")
      .getRawMany<{ category: string; count: string }>();
    const countsBy = new Map(counts.map((r) => [r.category, Number(r.count) || 0]));

    return {
      items: cats.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        seoKeywords: c.seoKeywords ?? [],
        order: c.order,
        isActive: c.isActive,
        threadsCount: countsBy.get(c.title) ?? 0,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    };
  }

  async create(dto: CreateCategoryDto) {
    const entity = this.categoriesRepo.create({
      title: dto.title.trim(),
      description: dto.description?.trim() ?? null,
      seoKeywords: dto.seoKeywords?.map((k) => k.trim()).filter(Boolean) ?? [],
      order: dto.order ?? 0,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.categoriesRepo.save(entity);
    return { id: saved.id };
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const c = await this.categoriesRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException("Category not found");

    if (typeof dto.title === "string") c.title = dto.title.trim();
    if (typeof dto.description === "string") c.description = dto.description.trim();
    if (dto.description === undefined) {
      // do nothing
    } else if (dto.description === "") {
      c.description = null;
    }
    if (Array.isArray(dto.seoKeywords)) {
      c.seoKeywords = dto.seoKeywords.map((k) => k.trim()).filter(Boolean);
    }
    if (typeof dto.order === "number") c.order = dto.order;
    if (typeof dto.isActive === "boolean") c.isActive = dto.isActive;

    await this.categoriesRepo.save(c);
    return { ok: true };
  }

  async remove(id: string) {
    const c = await this.categoriesRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException("Category not found");
    await this.categoriesRepo.remove(c);
    return { ok: true };
  }
}

