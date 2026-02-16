import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from './dto';
import { Roles } from '../common/decorators';
import { DefaultRole } from '../common/constants';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('api/v1/roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @Roles(DefaultRole.ADMIN)
  @ApiOperation({ summary: 'List all roles' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @Roles(DefaultRole.ADMIN)
  @ApiOperation({ summary: 'Get role with permissions' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @Roles(DefaultRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new role' })
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Patch(':id')
  @Roles(DefaultRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update role' })
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(DefaultRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete role (not system roles)' })
  delete(@Param('id') id: string) {
    return this.rolesService.delete(id);
  }

  @Post(':id/permissions')
  @Roles(DefaultRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign permissions to role' })
  assignPermissions(
    @Param('id') id: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissions(id, dto.permissionIds);
  }

  @Delete(':id/permissions/:permId')
  @Roles(DefaultRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Remove permission from role' })
  removePermission(
    @Param('id') id: string,
    @Param('permId') permId: string,
  ) {
    return this.rolesService.removePermission(id, permId);
  }
}
