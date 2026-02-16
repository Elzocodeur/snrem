import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { userRoles: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { userRoles: true } },
      },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async create(dto: CreateRoleDto) {
    return this.prisma.role.create({
      data: dto,
      include: { rolePermissions: { include: { permission: true } } },
    });
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem && dto.name && dto.name !== role.name) {
      throw new BadRequestException('Cannot rename a system role');
    }

    return this.prisma.role.update({
      where: { id },
      data: dto,
      include: { rolePermissions: { include: { permission: true } } },
    });
  }

  async delete(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) {
      throw new BadRequestException('Cannot delete a system role');
    }

    await this.prisma.role.delete({ where: { id } });
    return { message: 'Role deleted successfully' };
  }

  async assignPermissions(roleId: string, permissionIds: string[]) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: permissionIds } },
    });
    if (permissions.length !== permissionIds.length) {
      throw new NotFoundException('One or more permissions not found');
    }

    // SQLite does not support createMany with skipDuplicates, so upsert each.
    // For PostgreSQL: use createMany({ data: [...], skipDuplicates: true }).
    for (const permissionId of permissionIds) {
      await this.prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
    }

    return this.findOne(roleId);
  }

  async removePermission(roleId: string, permissionId: string) {
    const assignment = await this.prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
    if (!assignment) {
      throw new NotFoundException('Permission assignment not found');
    }

    await this.prisma.rolePermission.delete({ where: { id: assignment.id } });
    return { message: 'Permission removed from role' };
  }
}
