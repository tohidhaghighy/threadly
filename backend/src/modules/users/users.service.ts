import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity, type UserRole, type UserStatus } from "../../persistence/entities/user.entity";

@Injectable()
export class UsersService {
  constructor(@InjectRepository(UserEntity) private readonly usersRepo: Repository<UserEntity>) {}

  async findById(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async listAdmin(query?: { q?: string; role?: UserRole; status?: UserStatus }) {
    const qb = this.usersRepo.createQueryBuilder("u");
    if (query?.q) {
      qb.andWhere("(LOWER(u.name) LIKE :q OR LOWER(u.email) LIKE :q)", { q: `%${query.q.toLowerCase()}%` });
    }
    if (query?.role) qb.andWhere("u.role = :role", { role: query.role });
    if (query?.status) qb.andWhere("u.status = :status", { status: query.status });
    qb.orderBy("u.createdAt", "DESC");
    const items = await qb.getMany();
    return {
      items: items.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        joinedAt: u.createdAt,
      })),
      nextCursor: null,
    };
  }

  async setRole(userId: string, role: UserRole) {
    const user = await this.findById(userId);
    user.role = role;
    const saved = await this.usersRepo.save(user);
    return { id: saved.id, role: saved.role };
  }

  async setStatus(userId: string, status: UserStatus) {
    const user = await this.findById(userId);
    user.status = status;
    const saved = await this.usersRepo.save(user);
    return { id: saved.id, status: saved.status };
  }
}

