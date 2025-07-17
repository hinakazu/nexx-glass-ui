import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.pointsTransaction.deleteMany();
  await prisma.rewardRedemption.deleteMany();
  await prisma.recognition.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@company.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      department: 'IT',
      role: 'ADMIN',
      pointsBalance: 500,
      monthlyPointsAllocation: 200,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@company.com',
      password: hashedPassword,
      firstName: 'Manager',
      lastName: 'Smith',
      department: 'Engineering',
      role: 'MANAGER',
      pointsBalance: 150,
      monthlyPointsAllocation: 150,
    },
  });

  const employee1 = await prisma.user.create({
    data: {
      email: 'john@company.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      department: 'Engineering',
      role: 'EMPLOYEE',
      pointsBalance: 75,
      monthlyPointsAllocation: 100,
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      email: 'jane@company.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Wilson',
      department: 'Marketing',
      role: 'EMPLOYEE',
      pointsBalance: 120,
      monthlyPointsAllocation: 100,
    },
  });

  // Create rewards
  const reward1 = await prisma.reward.create({
    data: {
      title: 'Coffee Gift Card',
      description: 'Starbucks $10 gift card',
      pointsCost: 50,
      category: 'Food & Beverage',
      stockQuantity: 20,
    },
  });

  const reward2 = await prisma.reward.create({
    data: {
      title: 'Extra PTO Day',
      description: 'One additional paid time off day',
      pointsCost: 200,
      category: 'Time Off',
      stockQuantity: 10,
    },
  });

  const reward3 = await prisma.reward.create({
    data: {
      title: 'Team Lunch',
      description: 'Lunch for your team (up to 6 people)',
      pointsCost: 300,
      category: 'Team Building',
      stockQuantity: 5,
    },
  });

  // Create sample recognitions
  const recognition1 = await prisma.recognition.create({
    data: {
      senderId: manager.id,
      recipientId: employee1.id,
      message: 'Great work on the new feature implementation!',
      pointsAmount: 25,
      isPrivate: false,
    },
  });

  const recognition2 = await prisma.recognition.create({
    data: {
      senderId: employee1.id,
      recipientId: employee2.id,
      message: 'Thanks for your help with the marketing campaign!',
      pointsAmount: 15,
      isPrivate: false,
    },
  });

  // Create points transactions
  await prisma.pointsTransaction.create({
    data: {
      userId: employee1.id,
      type: 'EARNED',
      amount: 25,
      description: 'Recognition from Manager Smith',
      relatedId: recognition1.id,
    },
  });

  await prisma.pointsTransaction.create({
    data: {
      userId: employee2.id,
      type: 'EARNED',
      amount: 15,
      description: 'Recognition from John Doe',
      relatedId: recognition2.id,
    },
  });

  // Create monthly allocation transactions
  await prisma.pointsTransaction.create({
    data: {
      userId: admin.id,
      type: 'ALLOCATED',
      amount: 200,
      description: 'Monthly points allocation',
    },
  });

  await prisma.pointsTransaction.create({
    data: {
      userId: manager.id,
      type: 'ALLOCATED',
      amount: 150,
      description: 'Monthly points allocation',
    },
  });

  await prisma.pointsTransaction.create({
    data: {
      userId: employee1.id,
      type: 'ALLOCATED',
      amount: 100,
      description: 'Monthly points allocation',
    },
  });

  await prisma.pointsTransaction.create({
    data: {
      userId: employee2.id,
      type: 'ALLOCATED',
      amount: 100,
      description: 'Monthly points allocation',
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });