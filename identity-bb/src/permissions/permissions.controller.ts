import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto';
import { Roles } from '../common/decorators';
import { DefaultRole } from '../common/constants';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('api/v1/permissions')
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}

  @Get()
  @Roles(DefaultRole.ADMIN)
  @ApiOperation({ summary: 'List all permissions' })
  findAll() {
    return this.permissionsService.findAll();
  }

  @Post()
  @Roles(DefaultRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new permission' })
  create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.create(dto);
  }

  @Delete(':id')
  @Roles(DefaultRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a permission' })
  delete(@Param('id') id: string) {
    return this.permissionsService.delete(id);
  }
}
