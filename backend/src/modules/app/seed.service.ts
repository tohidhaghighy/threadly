import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { UserEntity } from "../../persistence/entities/user.entity";
import { CategoryEntity } from "../../persistence/entities/category.entity";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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

  seedAvatarSamples() {
    const dir = join(process.cwd(), "uploads", "avatars");
    mkdirSync(dir, { recursive: true });

    const makeAvatarSvg = (input: {
      bgA: string;
      bgB: string;
      skin: string;
      hair: string;
      shirt: string;
      accent: string;
      hairStyle: "short" | "bob" | "curly" | "hijab";
    }) => {
      const hairPath =
        input.hairStyle === "short"
          ? `<path d="M64 116c2-34 28-62 64-62s62 28 64 62c-10-16-28-28-64-28s-54 12-64 28z" fill="${input.hair}"/>`
          : input.hairStyle === "bob"
            ? `<path d="M58 128c0-44 32-78 70-78s70 34 70 78c0 20-10 42-26 54 2-10 3-18 2-26-2-22-22-38-46-38s-44 16-46 38c-1 8 0 16 2 26-16-12-26-34-26-54z" fill="${input.hair}"/>`
            : input.hairStyle === "curly"
              ? `<path d="M62 126c0-42 30-74 66-74s66 32 66 74c-4-10-10-18-18-24 0-14-12-26-26-26-6 0-12 2-16 6-4-4-10-6-16-6-14 0-26 12-26 26-8 6-14 14-18 24z" fill="${input.hair}"/>`
              : `<path d="M64 90c16-22 40-36 64-36s48 14 64 36v36c-8 18-24 34-44 44 4-16 6-30 4-40-4-24-38-38-88 0-2 10 0 24 4 40-20-10-36-26-44-44V90z" fill="${input.hair}"/>`;

      return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${input.bgA}"/>
      <stop offset="1" stop-color="${input.bgB}"/>
    </linearGradient>
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.18"/>
    </filter>
  </defs>

  <rect width="256" height="256" rx="128" fill="url(#bg)"/>
  <circle cx="128" cy="128" r="92" fill="#ffffff" fill-opacity="0.16"/>

  <!-- neck + shirt -->
  <path d="M104 184c6 10 16 16 24 16s18-6 24-16v-18h-48v18z" fill="${input.skin}" opacity="0.95"/>
  <path d="M64 234c12-34 44-54 64-54s52 20 64 54" fill="${input.shirt}" filter="url(#s)"/>
  <path d="M92 202c10 8 22 12 36 12s26-4 36-12" stroke="${input.accent}" stroke-width="10" stroke-linecap="round" opacity="0.6"/>

  <!-- head -->
  <circle cx="128" cy="126" r="56" fill="${input.skin}" filter="url(#s)"/>
  ${hairPath}

  <!-- eyes -->
  <circle cx="108" cy="126" r="6" fill="#111827"/>
  <circle cx="148" cy="126" r="6" fill="#111827"/>
  <circle cx="106" cy="124" r="2" fill="#ffffff" opacity="0.85"/>
  <circle cx="146" cy="124" r="2" fill="#ffffff" opacity="0.85"/>

  <!-- mouth -->
  <path d="M112 152c8 8 24 8 32 0" stroke="#111827" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.7"/>

  <!-- cheeks -->
  <circle cx="94" cy="148" r="10" fill="#fb7185" opacity="0.18"/>
  <circle cx="162" cy="148" r="10" fill="#fb7185" opacity="0.18"/>
</svg>`;
    };

    const samples = [
      // boys
      { bgA: "#0ea5e9", bgB: "#1d4ed8", skin: "#f2c9a0", hair: "#1f2937", shirt: "#111827", accent: "#60a5fa", hairStyle: "short" as const },
      { bgA: "#22c55e", bgB: "#15803d", skin: "#f7d3b0", hair: "#7c2d12", shirt: "#0f172a", accent: "#86efac", hairStyle: "curly" as const },
      { bgA: "#f97316", bgB: "#b45309", skin: "#eec39a", hair: "#0f172a", shirt: "#1f2937", accent: "#fdba74", hairStyle: "short" as const },
      { bgA: "#64748b", bgB: "#0f172a", skin: "#f3cfb6", hair: "#3f1d0b", shirt: "#111827", accent: "#cbd5e1", hairStyle: "curly" as const },
      // girls
      { bgA: "#a855f7", bgB: "#6d28d9", skin: "#f6d2c2", hair: "#111827", shirt: "#1f2937", accent: "#f0abfc", hairStyle: "bob" as const },
      { bgA: "#ec4899", bgB: "#be123c", skin: "#f0c8a6", hair: "#7c3aed", shirt: "#0f172a", accent: "#fda4af", hairStyle: "curly" as const },
      { bgA: "#14b8a6", bgB: "#0f766e", skin: "#f4d2b8", hair: "#111827", shirt: "#111827", accent: "#5eead4", hairStyle: "hijab" as const },
      { bgA: "#eab308", bgB: "#a16207", skin: "#f3c7a2", hair: "#4b5563", shirt: "#1f2937", accent: "#fde68a", hairStyle: "bob" as const },
    ];

    for (let i = 0; i < samples.length; i++) {
      const file = join(dir, `sample-${i + 1}.svg`);
      writeFileSync(file, makeAvatarSvg(samples[i]!), { encoding: "utf8" });
    }
  }
}

