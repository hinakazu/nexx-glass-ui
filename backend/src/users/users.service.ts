import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, isActive: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        department: true,
        role: true,
        avatarUrl: true,
        pointsBalance: true,
        monthlyPointsAllocation: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async searchUsers(query: string, currentUserId: string) {
    const users = await this.prisma.user.findMany({
      where: {
        AND: [
          { isActive: true },
          { id: { not: currentUserId } },
          {
            OR: [
              { firstName: { contains: query } },
              { lastName: { contains: query } },
              { department: { contains: query } },
              { email: { contains: query } },
            ],
          },
        ],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        department: true,
        role: true,
        avatarUrl: true,
      },
      take: 10,
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    });

    return users;
  }

  async updateProfile(userId: string, updateData: UpdateUserProfileDto) {
    const user = await this.findById(userId);

    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateData.email },
      });

      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        department: true,
        role: true,
        avatarUrl: true,
        pointsBalance: true,
        monthlyPointsAllocation: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    await this.findById(userId);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        department: true,
        role: true,
        avatarUrl: true,
        pointsBalance: true,
        monthlyPointsAllocation: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async getUserAnalytics(userId: string) {
    const user = await this.findById(userId);

    const [sentRecognitions, receivedRecognitions, pointsTransactions] = await Promise.all([
      this.prisma.recognition.findMany({
        where: { senderId: userId },
        include: {
          recipient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              department: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.recognition.findMany({
        where: { recipientId: userId },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              department: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.pointsTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    const totalPointsEarned = pointsTransactions
      .filter(t => t.type === 'EARNED')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPointsSpent = pointsTransactions
      .filter(t => t.type === 'SPENT')
      .reduce((sum, t) => sum + t.amount, 0);

    const thisMonthRecognitions = receivedRecognitions.filter(
      r => r.createdAt.getMonth() === new Date().getMonth()
    );

    return {
      user,
      stats: {
        totalRecognitionsSent: sentRecognitions.length,
        totalRecognitionsReceived: receivedRecognitions.length,
        totalPointsEarned,
        totalPointsSpent,
        thisMonthRecognitions: thisMonthRecognitions.length,
        currentBalance: user.pointsBalance,
      },
      recentSentRecognitions: sentRecognitions.slice(0, 5),
      recentReceivedRecognitions: receivedRecognitions.slice(0, 5),
      recentTransactions: pointsTransactions.slice(0, 10),
    };
  }

  async getAllUsers(currentUserId: string) {
    const users = await this.prisma.user.findMany({
      where: {
        AND: [
          { isActive: true },
          { id: { not: currentUserId } },
        ],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        department: true,
        role: true,
        avatarUrl: true,
        pointsBalance: true,
        createdAt: true,
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    });

    return users;
  }
}