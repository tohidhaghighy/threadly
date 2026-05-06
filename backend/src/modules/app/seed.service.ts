import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { UserEntity } from "../../persistence/entities/user.entity";
import { CategoryEntity } from "../../persistence/entities/category.entity";

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(UserEntity) private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(CategoryEntity) private readonly categoriesRepo: Repository<CategoryEntity>,
  ) {}

  async seedAdmin() {
    const email = "admin@threadly.com";
    const existing = await this.usersRepo.findOne({ where: { email } });
    const passwordHash = await bcrypt.hash("threadly", 10);

    if (!existing) {
      const user = this.usersRepo.create({
        name: "Threadly Admin",
        email,
        passwordHash,
        role: "admin",
        status: "active",
      });
      await this.usersRepo.save(user);
      return;
    }

    if (existing.role !== "admin") {
      existing.role = "admin";
    }
    if (existing.status !== "active") {
      existing.status = "active";
    }
    // keep password deterministic for local dev convenience
    existing.passwordHash = passwordHash;
    await this.usersRepo.save(existing);
  }

  async seedCategories() {
    const defaults: Array<{ title: string; description: string; order: number }> = [
      { title: "مونتاژ PC", description: "راهنمای ساخت، انتخاب قطعات و مونتاژ", order: 1 },
      { title: "گیمینگ و ستاپ", description: "نصب، اجرا و بهینه‌سازی بازی‌ها و تنظیمات", order: 2 },
      { title: "عیب‌یابی", description: "رفع مشکلات GPU، CPU، خنک‌کننده و پاور", order: 3 },
      { title: "نمایش سیستم‌ها", description: "اشتراک‌گذاری ستاپ و اسمبل‌ها", order: 4 },
      { title: "مانیتور و لوازم جانبی", description: "مانیتور، کیبورد، موس و هدست", order: 5 },
      { title: "حافظه و ذخیره‌سازی", description: "SSD، HDD و مدیریت داده", order: 6 },
    ];

    for (const c of defaults) {
      const existing = await this.categoriesRepo.findOne({ where: { title: c.title } });
      if (!existing) {
        await this.categoriesRepo.save(
          this.categoriesRepo.create({
            title: c.title,
            description: c.description,
            order: c.order,
            isActive: true,
          }),
        );
        continue;
      }

      // keep defaults up to date for local dev convenience
      existing.description = c.description;
      existing.order = c.order;
      if (existing.isActive !== true) existing.isActive = true;
      await this.categoriesRepo.save(existing);
    }
  }
}

