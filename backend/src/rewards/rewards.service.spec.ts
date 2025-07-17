import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { PrismaService } from '../prisma/prisma.service';
import { PointsService } from '../services/points.service';
import { RedemptionStatus, TransactionType } from '@prisma/client';

describe('RewardsService', () => {
  let service: RewardsService;
  let prismaService: any;
  let pointsService: any;

  const mockReward = {
    id: 'reward-1',
    title: 'Test Reward',
    description: 'Test reward description',
    pointsCost: 100,
    category: 'Electronics',
    imageUrl: 'test-image.jpg',
    isActive: true,
    stockQuantity: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    department: 'Engineering',
    pointsBalance: 500,
  };

  const mockRedemption = {
    id: 'redemption-1',
    userId: 'user-1',
    rewardId: 'reward-1',
    pointsSpent: 100,
    status: RedemptionStatus.PENDING,
    redemptionCode: 'ABC12345',
    createdAt: new Date(),
    user: mockUser,
    reward: mockReward,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardsService,
        {
          provide: PrismaService,
          useValue: {
            reward: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
              groupBy: jest.fn(),
            },
            rewardRedemption: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
              groupBy: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: PointsService,
          useValue: {
            getUserPointsBalance: jest.fn(),
            spendPoints: jest.fn(),
            addPoints: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RewardsService>(RewardsService);
    prismaService = module.get(PrismaService);
    pointsService = module.get(PointsService);
  });

  describe('createReward', () => {
    it('should create a new reward', async () => {
      const createRewardDto = {
        title: 'New Reward',
        description: 'New reward description',
        pointsCost: 200,
        category: 'Books',
        imageUrl: 'new-image.jpg',
        stockQuantity: 5,
      };

      const createdReward = { ...mockReward, ...createRewardDto };
      prismaService.reward.create.mockResolvedValue(createdReward);

      const result = await service.createReward(createRewardDto);

      expect(result).toEqual(createdReward);
      expect(prismaService.reward.create).toHaveBeenCalledWith({
        data: createRewardDto,
      });
    });
  });

  describe('getAllRewards', () => {
    it('should return all active rewards by default', async () => {
      const mockRewards = [mockReward];
      prismaService.reward.findMany.mockResolvedValue(mockRewards);

      const result = await service.getAllRewards();

      expect(result).toEqual(mockRewards);
      expect(prismaService.reward.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: [
          { category: 'asc' },
          { pointsCost: 'asc' },
        ],
      });
    });

    it('should return all rewards when activeOnly is false', async () => {
      const mockRewards = [mockReward];
      prismaService.reward.findMany.mockResolvedValue(mockRewards);

      const result = await service.getAllRewards(false);

      expect(result).toEqual(mockRewards);
      expect(prismaService.reward.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [
          { category: 'asc' },
          { pointsCost: 'asc' },
        ],
      });
    });
  });

  describe('getRewardById', () => {
    it('should return a reward by id', async () => {
      prismaService.reward.findUnique.mockResolvedValue(mockReward);

      const result = await service.getRewardById('reward-1');

      expect(result).toEqual(mockReward);
      expect(prismaService.reward.findUnique).toHaveBeenCalledWith({
        where: { id: 'reward-1' },
      });
    });

    it('should throw NotFoundException when reward not found', async () => {
      prismaService.reward.findUnique.mockResolvedValue(null);

      await expect(service.getRewardById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateReward', () => {
    it('should update a reward', async () => {
      const updateDto = { title: 'Updated Reward', pointsCost: 150 };
      const updatedReward = { ...mockReward, ...updateDto };

      jest.spyOn(service, 'getRewardById').mockResolvedValue(mockReward);
      prismaService.reward.update.mockResolvedValue(updatedReward);

      const result = await service.updateReward('reward-1', updateDto);

      expect(result).toEqual(updatedReward);
      expect(prismaService.reward.update).toHaveBeenCalledWith({
        where: { id: 'reward-1' },
        data: {
          ...updateDto,
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('deleteReward', () => {
    it('should delete a reward when no pending redemptions', async () => {
      jest.spyOn(service, 'getRewardById').mockResolvedValue(mockReward);
      prismaService.rewardRedemption.findMany.mockResolvedValue([]);
      prismaService.reward.delete.mockResolvedValue(mockReward);

      const result = await service.deleteReward('reward-1');

      expect(result).toEqual({ message: 'Reward deleted successfully' });
      expect(prismaService.reward.delete).toHaveBeenCalledWith({
        where: { id: 'reward-1' },
      });
    });

    it('should throw BadRequestException when pending redemptions exist', async () => {
      jest.spyOn(service, 'getRewardById').mockResolvedValue(mockReward);
      prismaService.rewardRedemption.findMany.mockResolvedValue([mockRedemption]);

      await expect(service.deleteReward('reward-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('redeemReward', () => {
    it('should successfully redeem a reward', async () => {
      const mockTx = {
        reward: {
          update: jest.fn(),
        },
        rewardRedemption: {
          create: jest.fn(),
        },
      };

      jest.spyOn(service, 'getRewardById').mockResolvedValue(mockReward);
      pointsService.getUserPointsBalance.mockResolvedValue({
        pointsBalance: 500,
        monthlyPointsAllocation: 100,
      });
      pointsService.spendPoints.mockResolvedValue({
        newBalance: 400,
        transactionAmount: 100,
      });

      mockTx.reward.update.mockResolvedValue({ ...mockReward, stockQuantity: 9 });
      mockTx.rewardRedemption.create.mockResolvedValue(mockRedemption);

      prismaService.$transaction.mockImplementation((callback) => callback(mockTx));

      const result = await service.redeemReward('user-1', 'reward-1');

      expect(result).toEqual(mockRedemption);
      expect(pointsService.spendPoints).toHaveBeenCalledWith(
        'user-1',
        100,
        'Redeemed reward: Test Reward',
        'reward-1',
      );
      expect(mockTx.reward.update).toHaveBeenCalledWith({
        where: { id: 'reward-1' },
        data: { stockQuantity: 9 },
      });
    });

    it('should throw BadRequestException when reward is not active', async () => {
      const inactiveReward = { ...mockReward, isActive: false };
      jest.spyOn(service, 'getRewardById').mockResolvedValue(inactiveReward);

      await expect(service.redeemReward('user-1', 'reward-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when reward is out of stock', async () => {
      const outOfStockReward = { ...mockReward, stockQuantity: 0 };
      jest.spyOn(service, 'getRewardById').mockResolvedValue(outOfStockReward);

      await expect(service.redeemReward('user-1', 'reward-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when user has insufficient points', async () => {
      jest.spyOn(service, 'getRewardById').mockResolvedValue(mockReward);
      pointsService.getUserPointsBalance.mockResolvedValue({
        pointsBalance: 50,
        monthlyPointsAllocation: 100,
      });

      await expect(service.redeemReward('user-1', 'reward-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle reward with null stock quantity', async () => {
      const unlimitedReward = { ...mockReward, stockQuantity: null };
      const mockTx = {
        reward: {
          update: jest.fn(),
        },
        rewardRedemption: {
          create: jest.fn(),
        },
      };

      jest.spyOn(service, 'getRewardById').mockResolvedValue(unlimitedReward);
      pointsService.getUserPointsBalance.mockResolvedValue({
        pointsBalance: 500,
        monthlyPointsAllocation: 100,
      });
      pointsService.spendPoints.mockResolvedValue({
        newBalance: 400,
        transactionAmount: 100,
      });

      mockTx.rewardRedemption.create.mockResolvedValue(mockRedemption);

      prismaService.$transaction.mockImplementation((callback) => callback(mockTx));

      await service.redeemReward('user-1', 'reward-1');

      expect(mockTx.reward.update).not.toHaveBeenCalled();
    });
  });

  describe('getUserRedemptions', () => {
    it('should return user redemptions', async () => {
      const mockRedemptions = [mockRedemption];
      prismaService.rewardRedemption.findMany.mockResolvedValue(mockRedemptions);

      const result = await service.getUserRedemptions('user-1');

      expect(result).toEqual(mockRedemptions);
      expect(prismaService.rewardRedemption.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { reward: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getAllRedemptions', () => {
    it('should return all redemptions with user and reward details', async () => {
      const mockRedemptions = [mockRedemption];
      prismaService.rewardRedemption.findMany.mockResolvedValue(mockRedemptions);

      const result = await service.getAllRedemptions();

      expect(result).toEqual(mockRedemptions);
      expect(prismaService.rewardRedemption.findMany).toHaveBeenCalledWith({
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
    });
  });

  describe('updateRedemptionStatus', () => {
    it('should update redemption status', async () => {
      const updatedRedemption = { ...mockRedemption, status: RedemptionStatus.APPROVED };
      prismaService.rewardRedemption.findUnique.mockResolvedValue(mockRedemption);
      prismaService.rewardRedemption.update.mockResolvedValue(updatedRedemption);

      const result = await service.updateRedemptionStatus(
        'redemption-1',
        RedemptionStatus.APPROVED,
      );

      expect(result).toEqual(updatedRedemption);
      expect(prismaService.rewardRedemption.update).toHaveBeenCalledWith({
        where: { id: 'redemption-1' },
        data: { status: RedemptionStatus.APPROVED },
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
    });

    it('should throw NotFoundException when redemption not found', async () => {
      prismaService.rewardRedemption.findUnique.mockResolvedValue(null);

      await expect(
        service.updateRedemptionStatus('nonexistent-id', RedemptionStatus.APPROVED),
      ).rejects.toThrow(NotFoundException);
    });

    it('should refund points and restore stock when cancelling pending redemption', async () => {
      const redemptionWithReward = {
        ...mockRedemption,
        reward: { ...mockReward, stockQuantity: 9 },
      };
      const updatedRedemption = { ...redemptionWithReward, status: RedemptionStatus.CANCELLED };

      prismaService.rewardRedemption.findUnique.mockResolvedValue(redemptionWithReward);
      pointsService.addPoints.mockResolvedValue({
        newBalance: 600,
        transactionAmount: 100,
      });
      prismaService.reward.update.mockResolvedValue({ ...mockReward, stockQuantity: 10 });
      prismaService.rewardRedemption.update.mockResolvedValue(updatedRedemption);

      const result = await service.updateRedemptionStatus(
        'redemption-1',
        RedemptionStatus.CANCELLED,
      );

      expect(result).toEqual(updatedRedemption);
      expect(pointsService.addPoints).toHaveBeenCalledWith(
        'user-1',
        100,
        'Refund for cancelled redemption: Test Reward',
        'EARNED',
        'redemption-1',
      );
      expect(prismaService.reward.update).toHaveBeenCalledWith({
        where: { id: 'reward-1' },
        data: { stockQuantity: 10 },
      });
    });

    it('should not refund points when cancelling non-pending redemption', async () => {
      const approvedRedemption = { ...mockRedemption, status: RedemptionStatus.APPROVED };
      const updatedRedemption = { ...approvedRedemption, status: RedemptionStatus.CANCELLED };

      prismaService.rewardRedemption.findUnique.mockResolvedValue(approvedRedemption);
      prismaService.rewardRedemption.update.mockResolvedValue(updatedRedemption);

      await service.updateRedemptionStatus('redemption-1', RedemptionStatus.CANCELLED);

      expect(pointsService.addPoints).not.toHaveBeenCalled();
      expect(prismaService.reward.update).not.toHaveBeenCalled();
    });
  });

  describe('getRedemptionById', () => {
    it('should return redemption by id', async () => {
      prismaService.rewardRedemption.findUnique.mockResolvedValue(mockRedemption);

      const result = await service.getRedemptionById('redemption-1');

      expect(result).toEqual(mockRedemption);
      expect(prismaService.rewardRedemption.findUnique).toHaveBeenCalledWith({
        where: { id: 'redemption-1' },
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
    });

    it('should throw NotFoundException when redemption not found', async () => {
      prismaService.rewardRedemption.findUnique.mockResolvedValue(null);

      await expect(service.getRedemptionById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getRewardsStatistics', () => {
    it('should return rewards statistics', async () => {
      const mockStats = {
        totalRewards: 10,
        activeRewards: 8,
        totalRedemptions: 25,
        pendingRedemptions: 3,
        categoryStats: [
          { category: 'Electronics', _count: { id: 5 } },
          { category: 'Books', _count: { id: 3 } },
        ],
        redemptionStats: [
          { status: RedemptionStatus.PENDING, _count: { id: 3 }, _sum: { pointsSpent: 300 } },
          { status: RedemptionStatus.APPROVED, _count: { id: 22 }, _sum: { pointsSpent: 2200 } },
        ],
      };

      prismaService.reward.count
        .mockResolvedValueOnce(10) // totalRewards
        .mockResolvedValueOnce(8); // activeRewards

      prismaService.rewardRedemption.count
        .mockResolvedValueOnce(25) // totalRedemptions
        .mockResolvedValueOnce(3); // pendingRedemptions

      prismaService.reward.groupBy.mockResolvedValue(mockStats.categoryStats);
      prismaService.rewardRedemption.groupBy.mockResolvedValue(mockStats.redemptionStats);

      const result = await service.getRewardsStatistics();

      expect(result).toEqual(mockStats);
    });
  });
});