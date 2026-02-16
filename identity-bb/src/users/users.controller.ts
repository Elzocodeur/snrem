import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, AssignRoleDto } from './dto';
import { Roles, RequirePermissions } from '../common/decorators';
import { DefaultRole } from '../common/constants';
import { PaginationQueryDto } from '../common/dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('api/v1/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(DefaultRole.ADMIN)
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'List users (paginated)' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles(DefaultRole.ADMIN)
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(DefaultRole.ADMIN)
  @RequirePermissions('users:create')
  @ApiOperation({ summary: 'Create a new user' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @Roles(DefaultRole.ADMIN)
  @RequirePermissions('users:update')
  @ApiOperation({ summary: 'Update user' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(DefaultRole.SUPER_ADMIN)
  @RequirePermissions('users:delete')
  @ApiOperation({ summary: 'Deactivate user (soft delete)' })
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }

  @Post(':id/roles')
  @Roles(DefaultRole.ADMIN)
  @RequirePermissions('users:update')
  @ApiOperation({ summary: 'Assign role to user' })
  assignRole(@Param('id') id: string, @Body() dto: AssignRoleDto) {
    return this.usersService.assignRole(id, dto.roleId);
  }

  @Delete(':id/roles/:roleId')
  @Roles(DefaultRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Remove role from user' })
  removeRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.usersService.removeRole(id, roleId);
  }
}
