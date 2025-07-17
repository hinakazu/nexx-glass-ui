import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PointsService } from '../services/points.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { RedemptionStatus, TransactionType } from '../types/enums';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RewardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pointsService: PointsService,
  ) {}

  async createReward(createRewardDto: CreateRewardDto) {
    const reward = await this.prisma.reward.create({
      data: createRewardDto,
    });

    return reward;
  }

  async getAllRewards(activeOnly: boolean = true) {
    const rewards = await this.prisma.reward.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: [
        { category: 'asc' },
        { pointsCost: 'asc' },
      ],
    });

    return rewards;
  }

  async getRewardById(id: string) {
    const reward = await this.prisma.reward.findUnique({
      where: { id },
    });

    if (!reward) {
      throw new NotFoundException('Reward not found');
    }

    return reward;
  }

  async updateReward(id: string, updateRewardDto: UpdateRewardDto) {
    const reward = await this.getRewardById(id);

    const updatedReward = await this.prisma.reward.update({
      where: { id },
      data: {
        ...updateRewardDto,
        updatedAt: new Date(),
      },
    });

    return updatedReward;
  }

  async deleteReward(id: string) {
    const reward = await this.getRewardById(id);

    // Check if there are any pending redemptions
    const pendingRedemptions = await this.prisma.rewardRedemption.findMany({
      where: {
        rewardId: id,
        status: RedemptionStatus.PENDING,
      },
    });

    if (pendingRedemptions.length > 0) {
      throw new BadRequestException('Cannot delete reward with pending redemptions');
    }

    await this.prisma.reward.delete({
      where: { id },
    });

    return { message: 'Reward deleted successfully' };
  }

  async redeemReward(userId: string, rewardId: string) {
    const reward = await this.getRewardById(rewardId);

    if (!reward.isActive) {
      throw new BadRequestException('Reward is not active');
    }

    // Check stock availability
    if (reward.stockQuantity !== null && reward.stockQuantity <= 0) {
      throw new BadRequestException('Reward is out of stock');
    }

    // Check if user has enough points
    const userBalance = await this.pointsService.getUserPointsBalance(userId);
    if (userBalance.pointsBalance < reward.pointsCost) {
      throw new BadRequestException('Insufficient points');
    }

    // Use transaction to ensure consistency
    return this.prisma.$transaction(async (tx) => {
      // Deduct points from user
      await this.pointsService.spendPoints(
        userId,
        reward.pointsCost,
        `Redeemed reward: ${reward.title}`,
        rewardId,
      );

      // Update stock quantity if applicable
      if (reward.stockQuantity !== null) {
        await tx.reward.update({
          where: { id: rewardId },
          data: { stockQuantity: reward.stockQuantity - 1 },
        });
      }

      // Create redemption record
      const redemption = await tx.rewardRedemption.create({
        data: {
          userId,
          rewardId,
          pointsSpent: reward.pointsCost,
          status: RedemptionStatus.PENDING,
          redemptionCode: uuidv4().substring(0, 8).toUpperCase(),
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: true,
            },
          },
          reward: true,
        },
      });

      return redemption;
    });
  }

  async getUserRedemptions(userId: string) {
    const redemptions = await this.prisma.rewardRedemption.findMany({
      where: { userId },
      include: {
        reward: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return redemptions;
  }

  async getAllRedemptions() {
    const redemptions = await this.prisma.rewardRedemption.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
          },
        },
        reward: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return redemptions;
  }

  async updateRedemptionStatus(redemptionId: string, status: RedemptionStatus) {
    const redemption = await this.prisma.rewardRedemption.findUnique({
      where: { id: redemptionId },
      include: { reward: true },
    });

    if (!redemption) {
      throw new NotFoundException('Redemption not found');
    }

    // If cancelling, refund points
    if (status === RedemptionStatus.CANCELLED && redemption.status === RedemptionStatus.PENDING) {
      await this.pointsService.addPoints(
        redemption.userId,
        redemption.pointsSpent,
        `Refund for cancelled redemption: ${redemption.reward.title}`,
        TransactionType.EARNED,
        redemptionId,
      );

      // Restore stock if applicable
      if (redemption.reward.stockQuantity !== null) {
        await this.prisma.reward.update({
          where: { id: redemption.rewardId },
          data: { stockQuantity: redemption.reward.stockQuantity + 1 },
        });
      }
    }

    const updatedRedemption = await this.prisma.rewardRedemption.update({
      where: { id: redemptionId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
          },
        },
        reward: true,
      },
    });

    return updatedRedemption;
  }

  async getRedemptionById(id: string) {
    const redemption = await this.prisma.rewardRedemption.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
          },
        },
        reward: true,
      },
    });

    if (!redemption) {
      throw new NotFoundException('Redemption not found');
    }

    return redemption;
  }

  async getRewardsStatistics() {
    const [totalRewards, activeRewards, totalRedemptions, pendingRedemptions] = await Promise.all([
      this.prisma.reward.count(),
      this.prisma.reward.count({ where: { isActive: true } }),
      this.prisma.rewardRedemption.count(),
      this.prisma.rewardRedemption.count({ where: { status: RedemptionStatus.PENDING } }),
    ]);

    const categoryStats = await this.prisma.reward.groupBy({
      by: ['category'],
      _count: { id: true },
      where: { isActive: true },
    });

    const redemptionStats = await this.prisma.rewardRedemption.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { pointsSpent: true },
    });

    return {
      totalRewards,
      activeRewards,
      totalRedemptions,
      pendingRedemptions,
      categoryStats,
      redemptionStats,
    };
  }
}