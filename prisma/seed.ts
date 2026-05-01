import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default admin user
  const passwordHash = await bcrypt.hash('Admin@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@atangcrm.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@atangcrm.com',
      password: passwordHash,
      role: 'admin',
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create a staff user
  const staffHash = await bcrypt.hash('Staff@123', 12);
  const staff = await prisma.user.upsert({
    where: { email: 'staff@atangcrm.com' },
    update: {},
    create: {
      name: 'Staff Member',
      email: 'staff@atangcrm.com',
      password: staffHash,
      role: 'staff',
    },
  });

  console.log('✅ Staff user created:', staff.email);

  // Create sample members
  const member1 = await prisma.member.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      phone: '+1-555-0101',
      address: '123 Main St, New York, NY 10001',
      createdBy: admin.id,
    },
  });

  const member2 = await prisma.member.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      name: 'Bob Smith',
      email: 'bob@example.com',
      phone: '+1-555-0102',
      address: '456 Oak Ave, Los Angeles, CA 90001',
      createdBy: admin.id,
    },
  });

  console.log('✅ Sample members created');

  // Create sample transactions
  await prisma.transaction.createMany({
    data: [
      {
        memberId: member1.id,
        amount: 1500.00,
        type: 'credit',
        description: 'Initial deposit',
        date: new Date('2024-01-15'),
        createdBy: admin.id,
      },
      {
        memberId: member1.id,
        amount: 250.00,
        type: 'debit',
        description: 'Service fee',
        date: new Date('2024-02-01'),
        createdBy: admin.id,
      },
      {
        memberId: member2.id,
        amount: 3000.00,
        type: 'credit',
        description: 'Account funding',
        date: new Date('2024-01-20'),
        createdBy: staff.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Sample transactions created');
  console.log('\n🎉 Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin login: admin@atangcrm.com / Admin@123');
  console.log('Staff login: staff@atangcrm.com / Staff@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
