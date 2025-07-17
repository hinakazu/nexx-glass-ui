import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PointsService } from './points.service';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '@prisma/client';

describe('PointsService', () => {
  let service: PointsService;
  let prismaService: any;

  const mockUser1 = {
    id: 'user-1',
    email: 'user1@example.com',
    firstName: 'John',
    lastName: 'Doe',
    pointsBalance: 500,
    monthlyPointsAllocation: 100,
    isActive: true,
  };

  const mockUser2 = {
    id: 'user-2',
    email: 'user2@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    pointsBalance: 300,
    monthlyPointsAllocation: 100,
    isActive: true,
  };

  const mockTransaction = {
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointsService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              aggregate: jest.fn(),
            },
            pointsTransaction: {
              findMany: jest.fn(),
              create: jest.fn(),
              createMany: jest.fn(),
              count: jest.fn(),
              groupBy: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PointsService>(PointsService);
    prismaService = module.get(PrismaService);
  });

  describe('transferPoints', () => {
    it('should successfully transfer points between users', async () => {
      const mockTx = {
        user: {
          findUnique: jest.fn(),
          update: jest.fn(),
        },
        pointsTransaction: {
          createMany: jest.fn(),
        },
      };

      mockTx.user.findUnique
        .mockResolvedValueOnce(mockUser1) // sender
        .mockResolvedValueOnce(mockUser2); // recipient

      mockTx.user.update
        .mockResolvedValueOnce({ ...mockUser1, pointsBalance: 400 }) // sender update
        .mockResolvedValueOnce({ ...mockUser2, pointsBalance: 400 }); // recipient update

      mockTx.pointsTransaction.createMany.mockResolvedValue({ count: 2 });

      prismaService.$transaction.mockImplementation((callback) => callback(mockTx));

      const result = await service.transferPoints(
        'user-1',
        'user-2',
        100,
        'Test transfer',
        'related-id',
      );

      expect(result).toEqual({
        senderNewBalance: 400,
        recipientNewBalance: 400,
        transactionAmount: 100,
      });

      expect(mockTx.user.findUnique).toHaveBeenCalledTimes(2);
      expect(mockTx.user.update).toHaveBeenCalledTimes(2);
      expect(mockTx.pointsTransaction.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId: 'user-1',
            type: TransactionType.SPENT,
            amount: -100,
            description: 'Sent to Jane Smith: Test transfer',
            relatedId: 'related-id',
          },
          {
            userId: 'user-2',
            type: TransactionType.EARNED,
            amount: 100,
            description: 'Received from John Doe: Test transfer',
            relatedId: 'related-id',
          },
        ],
      });
    });

    it('should throw BadRequestException when amount is not positive', async () => {
      await expect(
        service.transferPoints('user-1', 'user-2', 0, 'Test transfer'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.transferPoints('user-1', 'user-2', -10, 'Test transfer'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when trying to transfer to self', async () => {
      await expect(
        service.transferPoints('user-1', 'user-1', 100, 'Test transfer'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when sender has insufficient balance', async () => {
      const mockTx = {
        user: {
          findUnique: jest.fn(),
        },
      };

      mockTx.user.findUnique.mockResolvedValueOnce({
        ...mockUser1,
        pointsBalance: 50,
      });

      prismaService.$transaction.mockImplementation((callback) => callback(mockTx));

      await expect(
        service.transferPoints('user-1', 'user-2', 100, 'Test transfer'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when sender not found', async () => {
      const mockTx = {
        user: {
          findUnique: jest.fn(),
        },
      };

      mockTx.user.findUnique.mockResolvedValueOnce(null);

      prismaService.$transaction.mockImplementation((callback) => callback(mockTx));

      await expect(
        service.transferPoints('user-1', 'user-2', 100, 'Test transfer'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when recipient not found', async () => {
      const mockTx = {
        user: {
          findUnique: jest.fn(),
        },
      };

      mockTx.user.findUnique
        .mockResolvedValueOnce(mockUser1) // sender found
        .mockResolvedValueOnce(null); // recipient not found

      prismaService.$transaction.mockImplementation((callback) => callback(mockTx));

      await expect(
        service.transferPoints('user-1', 'user-2', 100, 'Test transfer'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('spendPoints', () => {
    it('should successfully spend points', async () => {
      const mockTx = {
        user: {
          findUnique: jest.fn(),
          update: jest.fn(),
        },
        pointsTransaction: {
          create: jest.fn(),
        },
      };

      mockTx.user.findUnique.mockResolvedValue(mockUser1);
      mockTx.user.update.mockResolvedValue({ ...mockUser1, pointsBalance: 400 });
      mockTx.pointsTransaction.create.mockResolvedValue({
        id: 'transaction-1',
        userId: 'user-1',
        type: TransactionType.SPENT,
        amount: -100,
        description: 'Test spending',
      });

      prismaService.$transaction.mockImplementation((callback) => callback(mockTx));

      const result = await service.spendPoints('user-1', 100, 'Test spending');

      expect(result).toEqual({
        newBalance: 400,
        transactionAmount: 100,
      });

      expect(mockTx.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { pointsBalance: 400 },
      });
    });

    it('should throw BadRequestException when amount is not positive', async () => {
      await expect(
        service.spendPoints('user-1', 0, 'Test spending'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when user has insufficient balance', async () => {
      const mockTx = {
        user: {
          findUnique: jest.fn(),
        },
      };

      mockTx.user.findUnique.mockResolvedValue({
        ...mockUser1,
        pointsBalance: 50,
      });

      prismaService.$transaction.mockImplementation((callback) => callback(mockTx));

      await expect(
        service.spendPoints('user-1', 100, 'Test spending'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('addPoints', () => {
    it('should successfully add points', async () => {
      const mockTx = {
        user: {
          findUnique: jest.fn(),
          update: jest.fn(),
        },
        pointsTransaction: {
          create: jest.fn(),
        },
      };

      mockTx.user.findUnique.mockResolvedValue(mockUser1);
      mockTx.user.update.mockResolvedValue({ ...mockUser1, pointsBalance: 600 });
      mockTx.pointsTransaction.create.mockResolvedValue({
        id: 'transaction-1',
        userId: 'user-1',
        type: TransactionType.EARNED,
        amount: 100,
        description: 'Test earning',
      });

      prismaService.$transaction.mockImplementation((callback) => callback(mockTx));

      const result = await service.addPoints('user-1', 100, 'Test earning');

      expect(result).toEqual({
        newBalance: 600,
        transactionAmount: 100,
      });

      expect(mockTx.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { pointsBalance: 600 },
      });
    });

    it('should throw BadRequestException when amount is not positive', async () => {
      await expect(
        service.addPoints('user-1', 0, 'Test earning'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when user not found', async () => {
      const mockTx = {
        user: {
          findUnique: jest.fn(),
        },
      };

      mockTx.user.findUnique.mockResolvedValue(null);

      prismaService.$transaction.mockImplementation((callback) => callback(mockTx));

      await expect(
        service.addPoints('user-1', 100, 'Test earning'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserPointsHistory', () => {
    it('should return user points history', async () => {
      const mockTransactions = [
        {
          id: 'trans-1',
          userId: 'user-1',
          type: TransactionType.EARNED,
          amount: 100,
          description: 'Test earning',
          createdAt: new Date(),
        },
        {
          id: 'trans-2',
          userId: 'user-1',
          type: TransactionType.SPENT,
          amount: -50,
          description: 'Test spending',
          createdAt: new Date(),
        },
      ];

      prismaService.pointsTransaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.getUserPointsHistory('user-1', 10);

      expect(result).toEqual(mockTransactions);
      expect(prismaService.pointsTransaction.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    });

    it('should use default limit when not specified', async () => {
      prismaService.pointsTransaction.findMany.mockResolvedValue([]);

      await service.getUserPointsHistory('user-1');

      expect(prismaService.pointsTransaction.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });
  });

  describe('getUserPointsBalance', () => {
    it('should return user points balance and allocation', async () => {
      const mockUserBalance = {
        pointsBalance: 500,
        monthlyPointsAllocation: 100,
      };

      prismaService.user.findUnique.mockResolvedValue(mockUserBalance);

      const result = await service.getUserPointsBalance('user-1');

      expect(result).toEqual(mockUserBalance);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1', isActive: true },
        select: {
          pointsBalance: true,
          monthlyPointsAllocation: true,
        },
      });
    });

    it('should throw BadRequestException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserPointsBalance('user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateUserMonthlyAllocation', () => {
    it('should update user monthly allocation', async () => {
      const updatedUser = {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        monthlyPointsAllocation: 200,
      };

      prismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateUserMonthlyAllocation('user-1', 200);

      expect(result).toEqual(updatedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { monthlyPointsAllocation: 200 },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          monthlyPointsAllocation: true,
        },
      });
    });

    it('should throw BadRequestException when allocation is negative', async () => {
      await expect(
        service.updateUserMonthlyAllocation('user-1', -10),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPointsStatistics', () => {
    it('should return points statistics', async () => {
      const mockStats = {
        totalPointsInSystem: 1000,
        totalTransactions: 50,
        monthlyStats: [
          {
            type: TransactionType.EARNED,
            _sum: { amount: 500 },
            _count: { id: 10 },
          },
          {
            type: TransactionType.SPENT,
            _sum: { amount: -300 },
            _count: { id: 8 },
          },
        ],
      };

      prismaService.user.aggregate.mockResolvedValue({
        _sum: { pointsBalance: 1000 },
      });
      prismaService.pointsTransaction.count.mockResolvedValue(50);
      prismaService.pointsTransaction.groupBy.mockResolvedValue(mockStats.monthlyStats);

      const result = await service.getPointsStatistics();

      expect(result).toEqual(mockStats);
    });

    it('should handle null totalPointsInSystem', async () => {
      prismaService.user.aggregate.mockResolvedValue({
        _sum: { pointsBalance: null },
      });
      prismaService.pointsTransaction.count.mockResolvedValue(0);
      prismaService.pointsTransaction.groupBy.mockResolvedValue([]);

      const result = await service.getPointsStatistics();

      expect(result.totalPointsInSystem).toBe(0);
    });
  });

  describe('resetMonthlyPointsAllocation', () => {
    it('should reset monthly points allocation for all active users', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          monthlyPointsAllocation: 100,
        },
        {
          id: 'user-2',
          firstName: 'Jane',
          lastName: 'Smith',
          monthlyPointsAllocation: 150,
        },
      ];

      prismaService.user.findMany.mockResolvedValue(mockUsers);

      const addPointsSpy = jest.spyOn(service, 'addPoints').mockResolvedValue({
        newBalance: 100,
        transactionAmount: 100,
      });

      await service.resetMonthlyPointsAllocation();

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        select: {
          id: true,
          monthlyPointsAllocation: true,
          firstName: true,
          lastName: true,
        },
      });

      expect(addPointsSpy).toHaveBeenCalledTimes(2);
      expect(addPointsSpy).toHaveBeenCalledWith(
        'user-1',
        100,
        'Monthly points allocation',
        TransactionType.ALLOCATED,
      );
      expect(addPointsSpy).toHaveBeenCalledWith(
        'user-2',
        150,
        'Monthly points allocation',
        TransactionType.ALLOCATED,
      );
    });
  });
});