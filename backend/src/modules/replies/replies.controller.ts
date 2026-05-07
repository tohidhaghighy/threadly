import { Body, Controller, Get, Param, Post, Req, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import type { Request } from "express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt.guard";
import { RepliesService } from "./replies.service";
import { CreateReplyDto } from "./dto";
import { FilesInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { randomUUID } from "crypto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ReplyAttachmentEntity } from "../../persistence/entities/reply-attachment.entity";
import { ReplyEntity } from "../../persistence/entities/reply.entity";
import { UsersService } from "../users/users.service";

function safeFileName(original: string) {
  const clean = original.replace(/[^\w.\-()+ ]+/g, "_").slice(-80);
  return clean || "image";
}

@ApiTags("replies")
@Controller("api/threads/:id/replies")
export class RepliesController {
  constructor(
    private readonly replies: RepliesService,
    private readonly users: UsersService,
    @InjectRepository(ReplyEntity) private readonly repliesRepo: Repository<ReplyEntity>,
    @InjectRepository(ReplyAttachmentEntity) private readonly attachmentsRepo: Repository<ReplyAttachmentEntity>,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(@Param("id") threadId: string, @Req() req: Request) {
    const user = req.user as { userId: string } | undefined;
    return this.replies.list(threadId, user?.userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({ schema: { example: { content: "برای شروع، CMOS را ریست کن و با یک RAM تست کن." } } })
  @ApiResponse({ status: 201, schema: { example: { id: "uuid" } } })
  create(@Param("id") threadId: string, @Req() req: Request, @Body() dto: CreateReplyDto) {
    const user = req.user as { userId: string };
    return this.replies.create(threadId, { authorId: user.userId, content: dto.content });
  }

  @Post(":replyId/images")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @ApiResponse({
    status: 201,
    schema: {
      example: { attachments: [{ id: "uuid", url: "/uploads/x.png", mimeType: "image/png", sizeBytes: 123 }] },
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
  async uploadReplyImages(
    @Req() req: Request,
    @Param("replyId") replyId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const user = req.user as { userId: string };
    const uploader = await this.users.findById(user.userId);

    const reply = await this.repliesRepo.findOne({ where: { id: replyId } });
    if (!reply) throw new Error("Reply not found");

    const saved = await this.attachmentsRepo.save(
      (files ?? []).map((f) =>
        this.attachmentsRepo.create({
          reply,
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

