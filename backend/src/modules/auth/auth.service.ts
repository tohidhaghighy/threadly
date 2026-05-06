import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";

import { UserEntity } from "../../persistence/entities/user.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity) private readonly usersRepo: Repository<UserEntity>,
    private readonly jwt: JwtService,
  ) {}

  async register(input: { name: string; email: string; password: string }) {
    const existing = await this.usersRepo.findOne({ where: { email: input.email.toLowerCase() } });
    if (existing) throw new ConflictException("Email already exists");

    const user = this.usersRepo.create({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: await bcrypt.hash(input.password, 10),
      role: "user",
      status: "active",
    });

    const saved = await this.usersRepo.save(user);
    return this.issueToken(saved);
  }

  async login(input: { email: string; password: string }) {
    const user = await this.usersRepo.findOne({ where: { email: input.email.toLowerCase() } });
    if (!user) throw new UnauthorizedException("Invalid credentials");
    if (user.status === "banned") throw new ForbiddenException("User is banned");

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");
    return this.issueToken(user);
  }

  async me(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.publicUser(user);
  }

  async changePassword(userId: string, input: { currentPassword: string; newPassword: string }) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (user.status === "banned") throw new ForbiddenException("User is banned");

    const ok = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid current password");

    user.passwordHash = await bcrypt.hash(input.newPassword, 10);
    await this.usersRepo.save(user);

    return { ok: true };
  }

  issueToken(user: UserEntity) {
    const payload = { sub: user.id, role: user.role };
    const token = this.jwt.sign(payload);
    return { token, user: this.publicUser(user) };
  }

  publicUser(user: UserEntity) {
    return { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status };
  }
}

