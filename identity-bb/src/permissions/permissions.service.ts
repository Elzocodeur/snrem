import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }

  async create(dto: CreatePermissionDto) {
    return this.prisma.permission.create({
      data: dto,
    });
  }

  async delete(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: { _count: { select: { rolePermissions: true } } },
    });
    if (!permission) throw new NotFoundException('Permission not found');

    if (permission._count.rolePermissions > 0) {
      throw new BadRequestException(
        'Cannot delete permission that is assigned to roles. Remove role assignments first.',
      );
    }

    await this.prisma.permission.delete({ where: { id } });
    return { message: 'Permission deleted successfully' };
  }
}
