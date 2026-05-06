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
import { AttachmentEntity } from "../src/persistence/entities/attachment.entity";
import { CategoryEntity } from "../src/persistence/entities/category.entity";
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
          entities: [UserEntity, ThreadEntity, ReplyEntity, AttachmentEntity, CategoryEntity],
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

    const thread = await threadsRepo.findOneOrFail({ where: { id: threadId } });
    expect(thread.repliesCount).toBe(1);
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

