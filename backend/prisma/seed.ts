import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash password for default admin
  const defaultPassword = await bcrypt.hash('Admin@123', SALT_ROUNDS);

  // Create Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@rg-polytechnic.in' },
    update: {},
    create: {
      email: 'admin@rg-polytechnic.in',
      password: defaultPassword,
      fullName: 'Super Administrator',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Created Super Admin:', superAdmin.email);

  // Create Store Admin
  const storeAdmin = await prisma.user.upsert({
    where: { email: 'store@rg-polytechnic.in' },
    update: {},
    create: {
      email: 'store@rg-polytechnic.in',
      password: defaultPassword,
      fullName: 'Store Administrator',
      role: 'STORE_ADMIN',
      department: 'STORE',
      isActive: true,
    },
  });

  console.log('✅ Created Store Admin:', storeAdmin.email);

  // Create Department Admins
  const deptAdmins = [
    {
      email: 'computer@rg-polytechnic.in',
      fullName: 'Computer Engineering Admin',
      role: 'DEPT_ADMIN_COMPUTER' as const,
      department: 'COMPUTER_ENGINEERING' as const,
    },
    {
      email: 'civil@rg-polytechnic.in',
      fullName: 'Civil Engineering Admin',
      role: 'DEPT_ADMIN_CIVIL' as const,
      department: 'CIVIL_ENGINEERING' as const,
    },
    {
      email: 'electrical@rg-polytechnic.in',
      fullName: 'Electrical Engineering Admin',
      role: 'DEPT_ADMIN_ELECTRICAL' as const,
      department: 'ELECTRICAL_ENGINEERING' as const,
    },
    {
      email: 'electronics@rg-polytechnic.in',
      fullName: 'Electronics & Telecommunication Admin',
      role: 'DEPT_ADMIN_ELECTRONICS' as const,
      department: 'ELECTRONICS_TELECOMMUNICATION' as const,
    },
    {
      email: 'mechanical@rg-polytechnic.in',
      fullName: 'Mechanical Engineering Admin',
      role: 'DEPT_ADMIN_MECHANICAL' as const,
      department: 'MECHANICAL_ENGINEERING' as const,
    },
  ];

  for (const admin of deptAdmins) {
    const user = await prisma.user.upsert({
      where: { email: admin.email },
      update: {},
      create: {
        email: admin.email,
        password: defaultPassword,
        fullName: admin.fullName,
        role: admin.role,
        department: admin.department,
        isActive: true,
      },
    });
    console.log(`✅ Created ${admin.fullName}:`, user.email);
  }

  // Create Categories
  const categories = [
    {
      name: 'Stationery',
      description: 'Pens, pencils, markers, staplers, etc.',
    },
    {
      name: 'Files & Documents',
      description: 'Folders, binders, registers, etc.',
    },
    {
      name: 'Electrical Items',
      description: 'Bulbs, switches, wires, etc.',
    },
    {
      name: 'Computer Accessories',
      description: 'Keyboards, mouse, USB drives, etc.',
    },
    {
      name: 'Computer Hardware',
      description: 'CPU, monitors, RAM, etc.',
    },
    {
      name: 'Furniture',
      description: 'Chairs, tables, desks, etc.',
    },
    {
      name: 'Teaching Aids',
      description: 'Chalk, dusters, boards, projectors, etc.',
    },
    {
      name: 'Laboratory Equipment',
      description: 'Equipment specific to each department',
    },
    {
      name: 'Consumables',
      description: 'Cleaning supplies, etc.',
    },
  ];

  for (const category of categories) {
    const cat = await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
    console.log(`✅ Created Category: ${cat.name}`);
  }

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

