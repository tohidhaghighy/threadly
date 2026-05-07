import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import request from "supertest";

import { AuthModule } from "../src/modules/auth/auth.module";
import { ThreadsModule } from "../src/modules/threads/threads.module";
import { RepliesModule } from "../src/modules/replies/replies.module";
import { AdminModule } from "../src/modules/admin/admin.module";
import { UsersModule } from "../src/modules/users/users.module";
import { CategoriesModule } from "../src/modules/categories/categories.module";
import { StatsController } from "../src/modules/app/stats.controller";

import { UserEntity } from "../src/persistence/entities/user.entity";
import { ThreadEntity } from "../src/persistence/entities/thread.entity";
import { ReplyEntity } from "../src/persistence/entities/reply.entity";
import { ReplyLikeEntity } from "../src/persistence/entities/reply-like.entity";
import { ReplyReactionEntity } from "../src/persistence/entities/reply-reaction.entity";
import { ReplyAttachmentEntity } from "../src/persistence/entities/reply-attachment.entity";
import { AttachmentEntity } from "../src/persistence/entities/attachment.entity";
import { CategoryEntity } from "../src/persistence/entities/category.entity";
import { ThreadLikeEntity } from "../src/persistence/entities/thread-like.entity";
import { ThreadViewEntity } from "../src/persistence/entities/thread-view.entity";
import { Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";

function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}

describe("Threadly API (e2e)", () => {
  let app: INestApplication;
  let usersRepo: Repository<UserEntity>;
  let threadsRepo: Repository<ThreadEntity>;
  let categoriesRepo: Repository<CategoryEntity>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: "sqlite",
          database: ":memory:",
          entities: [
            UserEntity,
            ThreadEntity,
            ReplyEntity,
            ReplyLikeEntity,
            ReplyReactionEntity,
            ReplyAttachmentEntity,
            AttachmentEntity,
            CategoryEntity,
            ThreadLikeEntity,
            ThreadViewEntity,
          ],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([UserEntity, ThreadEntity, CategoryEntity]),
        AuthModule,
        UsersModule,
        ThreadsModule,
        CategoriesModule,
        RepliesModule,
        AdminModule,
      ],
      controllers: [StatsController],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    usersRepo = moduleRef.get(getRepositoryToken(UserEntity));
    threadsRepo = moduleRef.get(getRepositoryToken(ThreadEntity));
    categoriesRepo = moduleRef.get(getRepositoryToken(CategoryEntity));
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it("register/login/me", async () => {
    const registerRes = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "Alice", email: "alice@example.com", password: "password123" })
      .expect(201);

    expect(registerRes.body.token).toBeTruthy();
    expect(registerRes.body.user.email).toBe("alice@example.com");

    const loginRes = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "alice@example.com", password: "password123" })
      .expect(201);

    const token = loginRes.body.token as string;
    expect(token).toBeTruthy();

    const meRes = await request(app.getHttpServer()).get("/api/auth/me").set(bearer(token)).expect(200);
    expect(meRes.body.email).toBe("alice@example.com");
  });

  it("change password", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "Pass", email: "pass@example.com", password: "password123" })
      .expect(201);

    const login1 = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "pass@example.com", password: "password123" })
      .expect(201);
    const token = login1.body.token as string;

    await request(app.getHttpServer())
      .post("/api/auth/change-password")
      .set(bearer(token))
      .send({ currentPassword: "password123", newPassword: "newpassword123" })
      .expect(201);

    // old password no longer works
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "pass@example.com", password: "password123" })
      .expect(401);

    // new password works
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "pass@example.com", password: "newpassword123" })
      .expect(201);
  });

  it("threads lifecycle: create pending -> approve -> public list/detail", async () => {
    // user
    const u = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "Bob", email: "bob@example.com", password: "password123" })
      .expect(201);
    const userToken = u.body.token as string;

    // admin
    const a = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "Admin", email: "admin@example.com", password: "password123" })
      .expect(201);
    let adminToken = a.body.token as string;

    const adminUser = await usersRepo.findOneOrFail({ where: { email: "admin@example.com" } });
    adminUser.role = "admin";
    await usersRepo.save(adminUser);
    adminToken = (
      await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({ email: "admin@example.com", password: "password123" })
        .expect(201)
    ).body.token as string;

    // create thread (pending)
    const createRes = await request(app.getHttpServer())
      .post("/api/threads")
      .set(bearer(userToken))
      .send({
        title: "My first question about GPUs",
        content: "I want to choose between GPU A and GPU B. Any advice?",
        category: "Hardware",
        tags: ["gpu", "advice"],
        language: "en",
      })
      .expect(201);

    const threadId = createRes.body.id as string;
    expect(threadId).toBeTruthy();
    expect(createRes.body.status).toBe("pending");

    // Not visible in public list/details while pending
    const listBefore = await request(app.getHttpServer()).get("/api/threads").expect(200);
    expect(listBefore.body.items.find((t: any) => t.id === threadId)).toBeUndefined();

    await request(app.getHttpServer()).get(`/api/threads/${threadId}`).expect(404);

    // Admin list sees it
    const adminQueue = await request(app.getHttpServer())
      .get("/api/admin/threads?status=pending")
      .set(bearer(adminToken))
      .expect(200);
    expect(adminQueue.body.items.some((t: any) => t.id === threadId)).toBe(true);

    // Approve
    await request(app.getHttpServer())
      .post(`/api/admin/threads/${threadId}/approve`)
      .set(bearer(adminToken))
      .expect(201);

    // Visible now
    const listAfter = await request(app.getHttpServer()).get("/api/threads").expect(200);
    const item = listAfter.body.items.find((t: any) => t.id === threadId);
    expect(item).toBeTruthy();
    expect(item.title).toBe("My first question about GPUs");

    const detail = await request(app.getHttpServer()).get(`/api/threads/${threadId}`).expect(200);
    expect(detail.body.content).toContain("choose between GPU");
  });

  it("replies: list + create (requires approved thread)", async () => {
    // user
    const u = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "Carol", email: "carol@example.com", password: "password123" })
      .expect(201);
    const userToken = u.body.token as string;

    // admin
    const a = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "Admin2", email: "admin2@example.com", password: "password123" })
      .expect(201);
    let adminToken = a.body.token as string;
    const adminUser = await usersRepo.findOneOrFail({ where: { email: "admin2@example.com" } });
    adminUser.role = "admin";
    await usersRepo.save(adminUser);
    adminToken = (
      await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({ email: "admin2@example.com", password: "password123" })
        .expect(201)
    ).body.token as string;

    // Create thread
    const createRes = await request(app.getHttpServer())
      .post("/api/threads")
      .set(bearer(userToken))
      .send({
        title: "Need PSU recommendation",
        content: "What PSU wattage do I need for a mid-range build?",
        category: "Power",
        tags: ["psu"],
        language: "en",
      })
      .expect(201);
    const threadId = createRes.body.id as string;

    // Reply should fail while pending
    await request(app.getHttpServer())
      .post(`/api/threads/${threadId}/replies`)
      .set(bearer(userToken))
      .send({ content: "Try 650W from a reputable brand." })
      .expect(404);

    // Approve
    await request(app.getHttpServer())
      .post(`/api/admin/threads/${threadId}/approve`)
      .set(bearer(adminToken))
      .expect(201);

    // Replies list empty
    const listEmpty = await request(app.getHttpServer()).get(`/api/threads/${threadId}/replies`).expect(200);
    expect(listEmpty.body.items).toHaveLength(0);

    // Create reply
    const replyRes = await request(app.getHttpServer())
      .post(`/api/threads/${threadId}/replies`)
      .set(bearer(userToken))
      .send({ content: "Try 650W from a reputable brand." })
      .expect(201);
    expect(replyRes.body.id).toBeTruthy();

    const listAfter = await request(app.getHttpServer()).get(`/api/threads/${threadId}/replies`).expect(200);
    expect(listAfter.body.items).toHaveLength(1);
    expect(listAfter.body.items[0].content).toContain("650W");

    const replyId = listAfter.body.items[0].id as string;
    expect(listAfter.body.items[0].likedByMe).toBe(false);
    expect(Array.isArray(listAfter.body.items[0].reactions)).toBe(true);

    const guestList = await request(app.getHttpServer()).get(`/api/threads/${threadId}/replies`).expect(200);
    expect(guestList.body.items[0].likedByMe).toBe(false);

    const likeRes = await request(app.getHttpServer())
      .post(`/api/replies/${replyId}/like`)
      .set(bearer(userToken))
      .expect(201);
    expect(likeRes.body.likesCount).toBe(1);
    expect(likeRes.body.likedByMe).toBe(true);

    const listWithLike = await request(app.getHttpServer())
      .get(`/api/threads/${threadId}/replies`)
      .set(bearer(userToken))
      .expect(200);
    expect(listWithLike.body.items[0].likedByMe).toBe(true);
    expect(listWithLike.body.items[0].likesCount).toBe(1);

    const reactRes = await request(app.getHttpServer())
      .post(`/api/replies/${replyId}/reactions`)
      .set(bearer(userToken))
      .send({ emoji: "👍" })
      .expect(201);
    expect(reactRes.body.reactions.some((x: any) => x.emoji === "👍" && x.reactedByMe === true)).toBe(true);

    const listWithReact = await request(app.getHttpServer())
      .get(`/api/threads/${threadId}/replies`)
      .set(bearer(userToken))
      .expect(200);
    expect(listWithReact.body.items[0].reactions.some((x: any) => x.emoji === "👍")).toBe(true);

    const thread = await threadsRepo.findOneOrFail({ where: { id: threadId } });
    expect(thread.repliesCount).toBe(1);
  });

  it("thread interactions: view + like (likedByMe)", async () => {
    // user
    const u = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "Viewer", email: "viewer@example.com", password: "password123" })
      .expect(201);
    const userToken = u.body.token as string;

    // admin
    const a = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "Admin3", email: "admin3@example.com", password: "password123" })
      .expect(201);
    let adminToken = a.body.token as string;
    const adminUser = await usersRepo.findOneOrFail({ where: { email: "admin3@example.com" } });
    adminUser.role = "admin";
    await usersRepo.save(adminUser);
    adminToken = (
      await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({ email: "admin3@example.com", password: "password123" })
        .expect(201)
    ).body.token as string;

    // create + approve thread
    const createRes = await request(app.getHttpServer())
      .post("/api/threads")
      .set(bearer(userToken))
      .send({
        title: "Views + Likes thread",
        content: "Testing views and likes",
        category: "Hardware",
        tags: [],
        language: "en",
      })
      .expect(201);
    const threadId = createRes.body.id as string;

    await request(app.getHttpServer())
      .post(`/api/admin/threads/${threadId}/approve`)
      .set(bearer(adminToken))
      .expect(201);

    // initial detail: likedByMe false
    const d0 = await request(app.getHttpServer()).get(`/api/threads/${threadId}`).set(bearer(userToken)).expect(200);
    expect(d0.body.likedByMe).toBe(false);
    const views0 = d0.body.counts.viewsCount as number;
    const likes0 = d0.body.counts.likesCount as number;

    // record view as logged-in user (increments on every open)
    const v1 = await request(app.getHttpServer()).post(`/api/threads/${threadId}/view`).set(bearer(userToken)).expect(201);
    expect(v1.body.viewsCount).toBe(views0 + 1);
    const v2 = await request(app.getHttpServer()).post(`/api/threads/${threadId}/view`).set(bearer(userToken)).expect(201);
    expect(v2.body.viewsCount).toBe(views0 + 2);

    // like toggle
    const l1 = await request(app.getHttpServer()).post(`/api/threads/${threadId}/like`).set(bearer(userToken)).expect(201);
    expect(l1.body.likesCount).toBe(likes0 + 1);
    expect(l1.body.likedByMe).toBe(true);

    const d1 = await request(app.getHttpServer()).get(`/api/threads/${threadId}`).set(bearer(userToken)).expect(200);
    expect(d1.body.likedByMe).toBe(true);
    expect(d1.body.counts.likesCount).toBe(likes0 + 1);

    // unlike
    const l2 = await request(app.getHttpServer()).post(`/api/threads/${threadId}/like`).set(bearer(userToken)).expect(201);
    expect(l2.body.likesCount).toBe(likes0);
    expect(l2.body.likedByMe).toBe(false);
  });

  it("admin replies management: search + update + delete", async () => {
    // create user + admin
    const u = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "CommentUser", email: "commentuser@example.com", password: "password123" })
      .expect(201);
    const userToken = u.body.token as string;

    const a = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "CommentAdmin", email: "commentadmin@example.com", password: "password123" })
      .expect(201);
    let adminToken = a.body.token as string;
    const adminUser = await usersRepo.findOneOrFail({ where: { email: "commentadmin@example.com" } });
    adminUser.role = "admin";
    await usersRepo.save(adminUser);
    adminToken = (
      await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({ email: "commentadmin@example.com", password: "password123" })
        .expect(201)
    ).body.token as string;

    // create + approve thread
    const createRes = await request(app.getHttpServer())
      .post("/api/threads")
      .set(bearer(userToken))
      .send({
        title: "Admin comment management thread",
        content: "Content for comment management",
        category: "Hardware",
        tags: [],
        language: "en",
      })
      .expect(201);
    const threadId = createRes.body.id as string;
    await request(app.getHttpServer())
      .post(`/api/admin/threads/${threadId}/approve`)
      .set(bearer(adminToken))
      .expect(201);

    // add a reply
    const replyRes = await request(app.getHttpServer())
      .post(`/api/threads/${threadId}/replies`)
      .set(bearer(userToken))
      .send({ content: "Original comment text" })
      .expect(201);
    const replyId = replyRes.body.id as string;

    // search replies by thread title
    const list1 = await request(app.getHttpServer())
      .get(`/api/admin/replies?threadQ=${encodeURIComponent("comment management")}`)
      .set(bearer(adminToken))
      .expect(200);
    expect(list1.body.items.some((r: any) => r.id === replyId)).toBe(true);

    // update reply
    const upd = await request(app.getHttpServer())
      .patch(`/api/admin/replies/${replyId}`)
      .set(bearer(adminToken))
      .send({ content: "Updated by admin" })
      .expect(200);
    expect(upd.body.content).toBe("Updated by admin");

    // delete reply
    await request(app.getHttpServer())
      .delete(`/api/admin/replies/${replyId}`)
      .set(bearer(adminToken))
      .expect(200);

    // thread repliesCount decremented back to 0
    const thread = await threadsRepo.findOneOrFail({ where: { id: threadId } });
    expect(thread.repliesCount).toBe(0);
  });

  it("auto ban user after 5 admin-deleted comments", async () => {
    // user + admin
    await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "AutoBanUser", email: "autoban@example.com", password: "password123" })
      .expect(201);

    const loginUser = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "autoban@example.com", password: "password123" })
      .expect(201);
    const userToken = loginUser.body.token as string;

    const adminReg = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "AutoBanAdmin", email: "autobanadmin@example.com", password: "password123" })
      .expect(201);
    let adminToken = adminReg.body.token as string;
    const adminUser = await usersRepo.findOneOrFail({ where: { email: "autobanadmin@example.com" } });
    adminUser.role = "admin";
    await usersRepo.save(adminUser);
    adminToken = (
      await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({ email: "autobanadmin@example.com", password: "password123" })
        .expect(201)
    ).body.token as string;

    // create + approve thread
    const createThread = await request(app.getHttpServer())
      .post("/api/threads")
      .set(bearer(userToken))
      .send({
        title: "Auto-ban thread",
        content: "Auto-ban content",
        category: "Hardware",
        tags: [],
        language: "en",
      })
      .expect(201);
    const threadId = createThread.body.id as string;
    await request(app.getHttpServer()).post(`/api/admin/threads/${threadId}/approve`).set(bearer(adminToken)).expect(201);

    // create 5 replies, delete them as admin
    const replyIds: string[] = [];
    for (let i = 0; i < 5; i++) {
      const r = await request(app.getHttpServer())
        .post(`/api/threads/${threadId}/replies`)
        .set(bearer(userToken))
        .send({ content: `spam ${i}` })
        .expect(201);
      replyIds.push(r.body.id as string);
    }

    for (const rid of replyIds) {
      await request(app.getHttpServer())
        .delete(`/api/admin/replies/${rid}`)
        .set(bearer(adminToken))
        .expect(200);
    }

    // user should now be banned, login forbidden
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "autoban@example.com", password: "password123" })
      .expect(403);
  });

  it("users leaderboard + profile: points and rank", async () => {
    // user A (threads + replies)
    const a = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "RankA", email: "ranka@example.com", password: "password123" })
      .expect(201);
    const aToken = a.body.token as string;
    const aId = a.body.user.id as string;

    // user B (reactions only)
    const b = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "RankB", email: "rankb@example.com", password: "password123" })
      .expect(201);
    const bToken = b.body.token as string;
    const bId = b.body.user.id as string;

    // admin approve
    const adminReg = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "RankAdmin", email: "rankadmin@example.com", password: "password123" })
      .expect(201);
    let adminToken = adminReg.body.token as string;
    const adminUser = await usersRepo.findOneOrFail({ where: { email: "rankadmin@example.com" } });
    adminUser.role = "admin";
    await usersRepo.save(adminUser);
    adminToken = (
      await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({ email: "rankadmin@example.com", password: "password123" })
        .expect(201)
    ).body.token as string;

    // create thread by A and approve (10 pts)
    const t = await request(app.getHttpServer())
      .post("/api/threads")
      .set(bearer(aToken))
      .send({ title: "Rank thread", content: "Rank content", category: "Hardware", tags: [], language: "en" })
      .expect(201);
    const threadId = t.body.id as string;
    await request(app.getHttpServer()).post(`/api/admin/threads/${threadId}/approve`).set(bearer(adminToken)).expect(201);

    // A adds 2 replies (4 pts)
    const r1 = await request(app.getHttpServer())
      .post(`/api/threads/${threadId}/replies`)
      .set(bearer(aToken))
      .send({ content: "A1" })
      .expect(201);
    const replyId = r1.body.id as string;
    await request(app.getHttpServer())
      .post(`/api/threads/${threadId}/replies`)
      .set(bearer(aToken))
      .send({ content: "A2" })
      .expect(201);

    // B reacts 5 times (5 pts) - toggle same emoji would add/remove, so use different emojis
    const emojis = ["👍", "👎", "❤️", "🔥", "🎉"];
    for (const e of emojis) {
      await request(app.getHttpServer())
        .post(`/api/replies/${replyId}/reactions`)
        .set(bearer(bToken))
        .send({ emoji: e })
        .expect(201);
    }

    // leaderboard: A should be above B (A=14, B=5)
    const lb = await request(app.getHttpServer()).get("/api/users/leaderboard?limit=10").expect(200);
    const items = lb.body.items as any[];
    const aRow = items.find((x) => x.id === aId);
    const bRow = items.find((x) => x.id === bId);
    expect(aRow).toBeTruthy();
    expect(bRow).toBeTruthy();
    expect(aRow.points).toBe(14);
    expect(bRow.points).toBe(5);
    expect(aRow.rank).toBe(1);
    expect(bRow.rank).toBeGreaterThan(1);

    // profile
    const pA = await request(app.getHttpServer()).get(`/api/users/${aId}/profile`).expect(200);
    expect(pA.body.points).toBe(14);
    expect(pA.body.rank).toBe(1);
    expect(pA.body.breakdown.threads).toBe(1);
    expect(pA.body.breakdown.comments).toBe(2);

    const pB = await request(app.getHttpServer()).get(`/api/users/${bId}/profile`).expect(200);
    expect(pB.body.points).toBe(5);
    expect(pB.body.breakdown.reactions).toBe(5);
  });

  it("admin user management: list users, set role, ban", async () => {
    const adminReg = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "Super", email: "super@example.com", password: "password123" })
      .expect(201);
    let adminToken = adminReg.body.token as string;

    const adminUser = await usersRepo.findOneOrFail({ where: { email: "super@example.com" } });
    adminUser.role = "admin";
    await usersRepo.save(adminUser);
    adminToken = (
      await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({ email: "super@example.com", password: "password123" })
        .expect(201)
    ).body.token as string;

    const targetReg = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "Dave", email: "dave@example.com", password: "password123" })
      .expect(201);
    const targetId = targetReg.body.user.id as string;

    const list = await request(app.getHttpServer()).get("/api/admin/users?q=dave").set(bearer(adminToken)).expect(200);
    expect(list.body.items.some((u: any) => u.id === targetId)).toBe(true);

    await request(app.getHttpServer())
      .post(`/api/admin/users/${targetId}/role`)
      .set(bearer(adminToken))
      .send({ role: "admin" })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/admin/users/${targetId}/ban`)
      .set(bearer(adminToken))
      .send({ status: "banned" })
      .expect(201);

    // Banned user cannot login
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "dave@example.com", password: "password123" })
      .expect(403);
  });

  it("thread image upload: images-only multipart", async () => {
    // user
    const u = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "Eve", email: "eve@example.com", password: "password123" })
      .expect(201);
    const userToken = u.body.token as string;

    // create thread
    const createRes = await request(app.getHttpServer())
      .post("/api/threads")
      .set(bearer(userToken))
      .send({
        title: "Case airflow question",
        content: "Here is my setup, what fan config is best?",
        category: "Cooling",
        tags: ["case", "fans"],
        language: "en",
      })
      .expect(201);
    const threadId = createRes.body.id as string;

    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG signature

    const upload = await request(app.getHttpServer())
      .post(`/api/threads/${threadId}/images`)
      .set(bearer(userToken))
      .attach("images", png, { filename: "test.png", contentType: "image/png" })
      .expect(201);

    expect(upload.body.attachments).toBeTruthy();
    expect(upload.body.attachments.length).toBe(1);
    expect(upload.body.attachments[0].mimeType).toBe("image/png");

    // non-image should be ignored (multer filter returns false), producing empty list
    const txt = Buffer.from("hello");
    const upload2 = await request(app.getHttpServer())
      .post(`/api/threads/${threadId}/images`)
      .set(bearer(userToken))
      .attach("images", txt, { filename: "test.txt", contentType: "text/plain" })
      .expect(201);
    expect(upload2.body.attachments.length).toBe(0);
  });

  it("reply image upload: images-only multipart", async () => {
    const u = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "ImgReply", email: "imgreply@example.com", password: "password123" })
      .expect(201);
    const userToken = u.body.token as string;

    const a = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "ImgReplyAdmin", email: "imgreplyadmin@example.com", password: "password123" })
      .expect(201);
    let adminToken = a.body.token as string;
    const adminUser = await usersRepo.findOneOrFail({ where: { email: "imgreplyadmin@example.com" } });
    adminUser.role = "admin";
    await usersRepo.save(adminUser);
    adminToken = (
      await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({ email: "imgreplyadmin@example.com", password: "password123" })
        .expect(201)
    ).body.token as string;

    const createRes = await request(app.getHttpServer())
      .post("/api/threads")
      .set(bearer(userToken))
      .send({
        title: "Reply image thread",
        content: "thread body",
        category: "Hardware",
        tags: [],
        language: "en",
      })
      .expect(201);
    const threadId = createRes.body.id as string;

    await request(app.getHttpServer())
      .post(`/api/admin/threads/${threadId}/approve`)
      .set(bearer(adminToken))
      .expect(201);

    const replyRes = await request(app.getHttpServer())
      .post(`/api/threads/${threadId}/replies`)
      .set(bearer(userToken))
      .send({ content: "here is image" })
      .expect(201);
    const replyId = replyRes.body.id as string;

    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG signature
    const upload = await request(app.getHttpServer())
      .post(`/api/threads/${threadId}/replies/${replyId}/images`)
      .set(bearer(userToken))
      .attach("images", png, { filename: "r.png", contentType: "image/png" })
      .expect(201);
    expect(upload.body.attachments?.length).toBe(1);

    const list = await request(app.getHttpServer()).get(`/api/threads/${threadId}/replies`).expect(200);
    const item = list.body.items.find((x: any) => x.id === replyId);
    expect(item).toBeTruthy();
    expect(Array.isArray(item.attachments)).toBe(true);
    expect(item.attachments.length).toBe(1);
    expect(item.attachments[0].mimeType).toBe("image/png");
  });

  it("stats: returns real numbers", async () => {
    // seed categories directly (not required, but keeps data consistent)
    await categoriesRepo.save(
      categoriesRepo.create({ title: "مونتاژ PC", description: "test", order: 1, isActive: true }),
    );

    // create a user + admin
    const u = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "StatUser", email: "statuser@example.com", password: "password123" })
      .expect(201);
    const userToken = u.body.token as string;

    const a = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "StatAdmin", email: "statadmin@example.com", password: "password123" })
      .expect(201);
    let adminToken = a.body.token as string;
    const adminUser = await usersRepo.findOneOrFail({ where: { email: "statadmin@example.com" } });
    adminUser.role = "admin";
    await usersRepo.save(adminUser);
    adminToken = (
      await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({ email: "statadmin@example.com", password: "password123" })
        .expect(201)
    ).body.token as string;

    // create 2 threads, approve only 1, add reply to approved thread
    const t1 = await request(app.getHttpServer())
      .post("/api/threads")
      .set(bearer(userToken))
      .send({
        title: "Stats thread 1",
        content: "Stats content 1",
        category: "مونتاژ PC",
        tags: [],
        language: "fa",
      })
      .expect(201);
    const t1Id = t1.body.id as string;

    const t2 = await request(app.getHttpServer())
      .post("/api/threads")
      .set(bearer(userToken))
      .send({
        title: "Stats thread 2",
        content: "Stats content 2",
        category: "مونتاژ PC",
        tags: [],
        language: "fa",
      })
      .expect(201);
    const t2Id = t2.body.id as string;

    await request(app.getHttpServer()).post(`/api/admin/threads/${t1Id}/approve`).set(bearer(adminToken)).expect(201);

    await request(app.getHttpServer())
      .post(`/api/threads/${t1Id}/replies`)
      .set(bearer(userToken))
      .send({ content: "a reply" })
      .expect(201);

    // keep t2 pending
    await request(app.getHttpServer()).get(`/api/threads/${t2Id}`).expect(404);

    const stats = await request(app.getHttpServer()).get("/api/stats").expect(200);
    expect(typeof stats.body.approvedThreadsCount).toBe("number");
    expect(typeof stats.body.usersCount).toBe("number");
    expect(typeof stats.body.responseRatePercent).toBe("number");
    expect(stats.body.approvedThreadsCount).toBeGreaterThanOrEqual(1);
    expect(stats.body.usersCount).toBeGreaterThanOrEqual(2);
    expect(stats.body.responseRatePercent).toBeGreaterThanOrEqual(0);
    expect(stats.body.responseRatePercent).toBeLessThanOrEqual(100);
  });

  it("categories: public list + admin CRUD", async () => {
    // admin
    const a = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "CatAdmin", email: "catadmin@example.com", password: "password123" })
      .expect(201);
    let adminToken = a.body.token as string;
    const adminUser = await usersRepo.findOneOrFail({ where: { email: "catadmin@example.com" } });
    adminUser.role = "admin";
    await usersRepo.save(adminUser);
    adminToken = (
      await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({ email: "catadmin@example.com", password: "password123" })
        .expect(201)
    ).body.token as string;

    // create
    const created = await request(app.getHttpServer())
      .post("/api/admin/categories")
      .set(bearer(adminToken))
      .send({ title: "کارت گرافیک", description: "GPU stuff", order: 10, isActive: true })
      .expect(201);
    const catId = created.body.id as string;
    expect(catId).toBeTruthy();

    // list admin
    const listAdmin = await request(app.getHttpServer()).get("/api/admin/categories").set(bearer(adminToken)).expect(200);
    expect(listAdmin.body.items.some((c: any) => c.id === catId)).toBe(true);

    // update
    await request(app.getHttpServer())
      .patch(`/api/admin/categories/${catId}`)
      .set(bearer(adminToken))
      .send({ description: "GPU + drivers", isActive: false })
      .expect(200);

    // public list should NOT include inactive category
    const public1 = await request(app.getHttpServer()).get("/api/categories").expect(200);
    expect(public1.body.items.some((c: any) => c.id === catId)).toBe(false);

    // reactivate
    await request(app.getHttpServer())
      .patch(`/api/admin/categories/${catId}`)
      .set(bearer(adminToken))
      .send({ isActive: true })
      .expect(200);

    const public2 = await request(app.getHttpServer()).get("/api/categories").expect(200);
    expect(public2.body.items.some((c: any) => c.id === catId)).toBe(true);

    // delete
    await request(app.getHttpServer()).delete(`/api/admin/categories/${catId}`).set(bearer(adminToken)).expect(200);
    const listAfter = await request(app.getHttpServer()).get("/api/admin/categories").set(bearer(adminToken)).expect(200);
    expect(listAfter.body.items.some((c: any) => c.id === catId)).toBe(false);
  });
});

