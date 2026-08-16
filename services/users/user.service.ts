import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { parsePermissions, type UserRole } from "@/lib/permissions";
import type { CreateUserInput, UpdateUserInput } from "@/validators/users";

export interface UserDto {
  id: string;
  username: string;
  role: UserRole;
  workerPrices: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapUser(row: {
  id: string;
  username: string;
  role: string;
  permissions: unknown;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): UserDto {
  const role = row.role as UserRole;
  const permissions = parsePermissions(row.permissions, role);
  return {
    id: row.id,
    username: row.username,
    role,
    workerPrices: permissions.workerPrices,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function permissionsPayload(role: UserRole, workerPrices: boolean) {
  return role === "ADMIN" ? { workerPrices: true } : { workerPrices };
}

export class UserService {
  async list(): Promise<UserDto[]> {
    const rows = await prisma.user.findMany({ orderBy: { username: "asc" } });
    return rows.map(mapUser);
  }

  async create(input: CreateUserInput): Promise<UserDto> {
    const existing = await prisma.user.findUnique({ where: { username: input.username } });
    if (existing) throw new Error("Username already exists");

    const passwordHash = await bcrypt.hash(input.password, 12);
    const role = input.role;
    const row = await prisma.user.create({
      data: {
        username: input.username,
        passwordHash,
        role,
        isActive: input.isActive,
        permissions: permissionsPayload(role, input.workerPrices),
      },
    });
    return mapUser(row);
  }

  async update(id: string, input: UpdateUserInput): Promise<UserDto> {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new Error("User not found");

    if (input.username && input.username !== existing.username) {
      const clash = await prisma.user.findUnique({ where: { username: input.username } });
      if (clash) throw new Error("Username already exists");
    }

    const nextRole = (input.role ?? existing.role) as UserRole;
    const currentPerms = parsePermissions(existing.permissions, existing.role as UserRole);
    const workerPrices = input.workerPrices ?? currentPerms.workerPrices;

    const row = await prisma.user.update({
      where: { id },
      data: {
        ...(input.username ? { username: input.username } : {}),
        ...(input.password ? { passwordHash: await bcrypt.hash(input.password, 12) } : {}),
        ...(input.role ? { role: input.role } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        permissions: permissionsPayload(nextRole, workerPrices),
      },
    });

    if (input.password || input.isActive === false) {
      await prisma.authSession.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return mapUser(row);
  }
}

export const userService = new UserService();
