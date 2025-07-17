import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TransactionType } from '@prisma/client';

@Injectable()
export class PointsService {
  constructor(private readonly prisma: PrismaService) {}

  async transferPoints(
    fromUserId: string,
    toUserId: string,
    amount: number,
    description: string,
    relatedId?: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Points amount must be positive');
    }

    if (fromUserId === toUserId) {
      throw new BadRequestException('Cannot transfer points to yourself');
    }

    // Use transaction to ensure data consistency
    return this.prisma.$transaction(async (tx) => {
      // Check if sender has enough points
      const sender = await tx.user.findUnique({
        where: { id: fromUserId, isActive: true },
      });

      if (!sender) {
        throw new BadRequestException('Sender not found');
      }

      if (sender.pointsBalance < amount) {
        throw new BadRequestException('Insufficient points balance');
      }

      // Check if recipient exists
      const recipient = await tx.user.findUnique({
        where: { id: toUserId, isActive: true },
      });

      if (!recipient) {
        throw new BadRequestException('Recipient not found');
      }

      // Deduct points from sender
      await tx.user.update({
        where: { id: fromUserId },
        data: { pointsBalance: sender.pointsBalance - amount },
      });

      // Add points to recipient
      await tx.user.update({
        where: { id: toUserId },
        data: { pointsBalance: recipient.pointsBalance + amount },
      });

      // Create transaction records
      await tx.pointsTransaction.createMany({
        data: [
          {
            userId: fromUserId,
            type: TransactionType.SPENT,
            amount: -amount,
            description: `Sent to ${recipient.firstName} ${recipient.lastName}: ${description}`,
            relatedId,
          },
          {
            userId: toUserId,
            type: TransactionType.EARNED,
            amount: amount,
            description: `Received from ${sender.firstName} ${sender.lastName}: ${description}`,
            relatedId,
          },
        ],
      });

      return {
        senderNewBalance: sender.pointsBalance - amount,
        recipientNewBalance: recipient.pointsBalance + amount,
        transactionAmount: amount,
      };
    });
  }

  async spendPoints(
    userId: string,
    amount: number,
    description: string,
    relatedId?: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Points amount must be positive');
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId, isActive: true },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (user.pointsBalance < amount) {
        throw new BadRequestException('Insufficient points balance');
      }

      // Deduct points
      await tx.user.update({
        where: { id: userId },
        data: { pointsBalance: user.pointsBalance - amount },
      });

      // Create transaction record
      await tx.pointsTransaction.create({
        data: {
          userId,
          type: TransactionType.SPENT,
          amount: -amount,
          description,
          relatedId,
        },
      });

      return {
        newBalance: user.pointsBalance - amount,
        transactionAmount: amount,
      };
    });
  }

  async addPoints(
    userId: string,
    amount: number,
    description: string,
    type: TransactionType = TransactionType.EARNED,
    relatedId?: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Points amount must be positive');
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId, isActive: true },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Add points
      await tx.user.update({
        where: { id: userId },
        data: { pointsBalance: user.pointsBalance + amount },
      });

      // Create transaction record
      await tx.pointsTransaction.create({
        data: {
          userId,
          type,
          amount,
          description,
          relatedId,
        },
      });

      return {
        newBalance: user.pointsBalance + amount,
        transactionAmount: amount,
      };
    });
  }

  async getUserPointsHistory(userId: string, limit: number = 50) {
    const transactions = await this.prisma.pointsTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return transactions;
  }

  async getUserPointsBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: {
        pointsBalance: true,
        monthlyPointsAllocation: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  // Cron job to reset monthly points allocation
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async resetMonthlyPointsAllocation() {
    console.log('Starting monthly points allocation reset...');

    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        monthlyPointsAllocation: true,
        firstName: true,
        lastName: true,
      },
    });

    for (const user of users) {
      await this.addPoints(
        user.id,
        user.monthlyPointsAllocation,
        'Monthly points allocation',
        TransactionType.ALLOCATED,
      );
    }

    console.log(`Monthly points allocation completed for ${users.length} users`);
  }

  // Admin function to manually trigger monthly allocation
  async triggerMonthlyAllocation() {
    await this.resetMonthlyPointsAllocation();
  }

  // Admin function to update user's monthly allocation
  async updateUserMonthlyAllocation(userId: string, newAllocation: number) {
    if (newAllocation < 0) {
      throw new BadRequestException('Monthly allocation must be non-negative');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { monthlyPointsAllocation: newAllocation },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        monthlyPointsAllocation: true,
      },
    });

    return user;
  }

  // Get points statistics for analytics
  async getPointsStatistics() {
    const [totalPointsInSystem, totalTransactions, monthlyStats] = await Promise.all([
      this.prisma.user.aggregate({
        _sum: { pointsBalance: true },
        where: { isActive: true },
      }),
      this.prisma.pointsTransaction.count(),
      this.prisma.pointsTransaction.groupBy({
        by: ['type'],
        _sum: { amount: true },
        _count: { id: true },
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return {
      totalPointsInSystem: totalPointsInSystem._sum.pointsBalance || 0,
      totalTransactions,
      monthlyStats,
    };
  }
}