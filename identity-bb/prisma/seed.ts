import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create permissions
  const permissionData = [
    { resource: 'users', action: 'create', description: 'Create users' },
    { resource: 'users', action: 'read', description: 'Read users' },
    { resource: 'users', action: 'update', description: 'Update users' },
    { resource: 'users', action: 'delete', description: 'Delete users' },
    { resource: 'roles', action: 'create', description: 'Create roles' },
    { resource: 'roles', action: 'read', description: 'Read roles' },
    { resource: 'roles', action: 'update', description: 'Update roles' },
    { resource: 'roles', action: 'delete', description: 'Delete roles' },
    { resource: 'permissions', action: 'create', description: 'Create permissions' },
    { resource: 'permissions', action: 'read', description: 'Read permissions' },
    { resource: 'permissions', action: 'delete', description: 'Delete permissions' },
    { resource: 'oidc-clients', action: 'create', description: 'Create OIDC clients' },
    { resource: 'oidc-clients', action: 'read', description: 'Read OIDC clients' },
    { resource: 'oidc-clients', action: 'update', description: 'Update OIDC clients' },
    { resource: 'oidc-clients', action: 'delete', description: 'Delete OIDC clients' },
    { resource: 'audit-logs', action: 'read', description: 'Read audit logs' },
  ];

  const permissions: Record<string, any> = {};
  for (const p of permissionData) {
    const perm = await prisma.permission.upsert({
      where: { resource_action: { resource: p.resource, action: p.action } },
      update: {},
      create: p,
    });
    permissions[`${p.resource}:${p.action}`] = perm;
  }
  console.log(`Created ${Object.keys(permissions).length} permissions`);

  // 2. Create roles
  const superAdmin = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      description: 'Super administrator with full system access',
      isSystem: true,
    },
  });

  const admin = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrator managing day-to-day operations',
      isSystem: true,
    },
  });

  const agent = await prisma.role.upsert({
    where: { name: 'AGENT' },
    update: {},
    create: {
      name: 'AGENT',
      description: 'Government agent processing identity requests',
      isSystem: true,
    },
  });

  const citizen = await prisma.role.upsert({
    where: { name: 'CITIZEN' },
    update: {},
    create: {
      name: 'CITIZEN',
      description: 'Citizen with access to own profile only',
      isSystem: true,
    },
  });
  console.log('Created 4 system roles');

  // 3. Assign permissions to ADMIN role
  const adminPermKeys = [
    'users:create', 'users:read', 'users:update', 'users:delete',
    'roles:read', 'roles:create', 'roles:update',
    'permissions:read',
    'oidc-clients:create', 'oidc-clients:read', 'oidc-clients:update', 'oidc-clients:delete',
    'audit-logs:read',
  ];
  for (const key of adminPermKeys) {
    const perm = permissions[key];
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: admin.id, permissionId: perm.id } },
        update: {},
        create: { roleId: admin.id, permissionId: perm.id },
      });
    }
  }
  console.log(`Assigned ${adminPermKeys.length} permissions to ADMIN`);

  // 4. Assign permissions to AGENT role
  const agentPermKeys = ['users:read', 'users:update'];
  for (const key of agentPermKeys) {
    const perm = permissions[key];
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: agent.id, permissionId: perm.id } },
        update: {},
        create: { roleId: agent.id, permissionId: perm.id },
      });
    }
  }
  console.log(`Assigned ${agentPermKeys.length} permissions to AGENT`);

  // 5. Create default super admin user
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@govstack.local';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@123456';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      firstName: 'System',
      lastName: 'Admin',
      status: 'ACTIVE',
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: superAdmin.id } },
    update: {},
    create: { userId: adminUser.id, roleId: superAdmin.id },
  });

  console.log(`Created admin user: ${adminEmail}`);
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
