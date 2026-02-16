import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BCRYPT_ROUNDS } from '../common/constants';
import { PaginationQueryDto } from '../common/dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        include: { userRoles: { include: { role: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users.map(({ passwordHash, ...user }) => user),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: {
              include: { rolePermissions: { include: { permission: true } } },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, ...result } = user;
    return result;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const { password, ...data } = dto;

    const user = await this.prisma.user.create({
      data: { ...data, passwordHash },
      include: { userRoles: { include: { role: true } } },
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.ensureExists(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
      include: { userRoles: { include: { role: true } } },
    });
    const { passwordHash, ...result } = user;
    return result;
  }

  async deactivate(id: string) {
    await this.ensureExists(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
    const { passwordHash, ...result } = user;
    return result;
  }

  async assignRole(userId: string, roleId: string) {
    await this.ensureExists(userId);
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    const existing = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
    });
    if (existing) throw new ConflictException('Role already assigned');

    return this.prisma.userRole.create({
      data: { userId, roleId },
      include: { role: true },
    });
  }

  async removeRole(userId: string, roleId: string) {
    await this.ensureExists(userId);
    const assignment = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
    });
    if (!assignment) throw new NotFoundException('Role assignment not found');

    await this.prisma.userRole.delete({
      where: { id: assignment.id },
    });
    return { message: 'Role removed successfully' };
  }

  private async ensureExists(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
  }
}
