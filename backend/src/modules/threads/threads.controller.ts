import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import type { Request } from "express";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { randomUUID } from "crypto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiResponse, ApiTags } from "@nestjs/swagger";

import { ThreadsService } from "./threads.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { CreateThreadDto } from "./dto";
import { AttachmentEntity } from "../../persistence/entities/attachment.entity";
import { UsersService } from "../users/users.service";
import { ThreadEntity } from "../../persistence/entities/thread.entity";

function safeFileName(original: string) {
  const clean = original.replace(/[^\w.\-()+ ]+/g, "_").slice(-80);
  return clean || "image";
}

@ApiTags("threads")
@Controller("api/threads")
export class ThreadsController {
  constructor(
    private readonly threads: ThreadsService,
    private readonly users: UsersService,
    @InjectRepository(ThreadEntity) private readonly threadsRepo: Repository<ThreadEntity>,
    @InjectRepository(AttachmentEntity) private readonly attachmentsRepo: Repository<AttachmentEntity>,
  ) {}

  @Get()
  list(
    @Query("category") category?: string,
    @Query("sort") sort?: string,
    @Query("q") q?: string,
    @Query("lang") lang?: "fa" | "en",
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.threads.listPublic({ category, sort, q, lang, cursor, limit });
  }

  @Get("categories")
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        items: [
          { category: "مونتاژ PC", count: 12 },
          { category: "عیب‌یابی", count: 8 },
        ],
      },
    },
  })
  categories() {
    return this.threads.categoryCounts();
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.threads.getPublic(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      example: {
        title: "سیستم بعد از نصب کارت گرافیک بوت نمی‌شود",
        content: "بعد از نصب RTX 4080 سیستم روشن می‌شود ولی تصویر نمی‌آید. پاور ۷۵۰ وات است...",
        category: "Hardware",
        tags: ["gpu", "psu"],
        language: "fa",
      },
    },
  })
  @ApiResponse({ status: 201, schema: { example: { id: "uuid", status: "pending" } } })
  create(@Req() req: Request, @Body() dto: CreateThreadDto) {
    const user = req.user as { userId: string };
    return this.threads.createPending({ authorId: user.userId, ...dto });
  }

  @Post(":id/images")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @ApiResponse({
    status: 201,
    schema: {
      example: {
        attachments: [
          { id: "uuid", url: "/uploads/filename.png", mimeType: "image/png", sizeBytes: 12345 },
        ],
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor("images", 10, {
      storage: diskStorage({
        destination: join(process.cwd(), "uploads"),
        filename: (_req, file, cb) => {
          const name = `${randomUUID()}${extname(file.originalname)}`;
          cb(null, name);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) return cb(null, false);
        cb(null, true);
      },
    }),
  )
  async uploadImages(
    @Req() req: Request,
    @Param("id") id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const user = req.user as { userId: string };
    const uploader = await this.users.findById(user.userId);

    const thread = await this.threadsRepo.findOne({ where: { id } });
    if (!thread) throw new Error("Thread not found");

    const saved = await this.attachmentsRepo.save(
      (files ?? []).map((f) =>
        this.attachmentsRepo.create({
          thread,
          uploader,
          originalFileName: safeFileName(f.originalname),
          mimeType: f.mimetype,
          sizeBytes: f.size,
          url: `/uploads/${f.filename}`,
        }),
      ),
    );

    return {
      attachments: saved.map((a) => ({
        id: a.id,
        url: a.url,
        mimeType: a.mimeType,
        sizeBytes: a.sizeBytes,
      })),
    };
  }
}

