import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PointsService } from '../services/points.service';
import { CreateRecognitionDto } from './dto/create-recognition.dto';
import { UpdateRecognitionPrivacyDto } from './dto/update-recognition-privacy.dto';

@Injectable()
export class RecognitionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pointsService: PointsService,
  ) {}

  async createRecognition(senderId: string, createRecognitionDto: CreateRecognitionDto) {
    const { recipientId, message, pointsAmount, isPrivate } = createRecognitionDto;

    if (senderId === recipientId) {
      throw new BadRequestException('Cannot send recognition to yourself');
    }

    if (pointsAmount <= 0) {
      throw new BadRequestException('Points amount must be positive');
    }

    // Check if recipient exists
    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientId, isActive: true },
    });

    if (!recipient) {
      throw new BadRequestException('Recipient not found');
    }

    // Use transaction to ensure data consistency
    return this.prisma.$transaction(async (tx) => {
      // Create recognition
      const recognition = await tx.recognition.create({
        data: {
          senderId,
          recipientId,
          message,
          pointsAmount,
          isPrivate: isPrivate || false,
        },
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
      });

      // Transfer points from sender to recipient
      await this.pointsService.transferPoints(
        senderId,
        recipientId,
        pointsAmount,
        `Recognition: ${message}`,
        recognition.id,
      );

      return recognition;
    });
  }

  async getRecognitionFeed(limit: number = 20, offset: number = 0) {
    const recognitions = await this.prisma.recognition.findMany({
      where: { isPrivate: false },
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
      skip: offset,
      take: limit,
    });

    const totalCount = await this.prisma.recognition.count({
      where: { isPrivate: false },
    });

    return {
      recognitions,
      totalCount,
      hasMore: offset + limit < totalCount,
    };
  }

  async getUserRecognitions(userId: string, type: 'sent' | 'received' | 'all' = 'all', limit: number = 20, offset: number = 0) {
    let whereClause: any = {};

    switch (type) {
      case 'sent':
        whereClause = { senderId: userId };
        break;
      case 'received':
        whereClause = { recipientId: userId };
        break;
      case 'all':
        whereClause = {
          OR: [
            { senderId: userId },
            { recipientId: userId },
          ],
        };
        break;
    }

    const recognitions = await this.prisma.recognition.findMany({
      where: whereClause,
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
      skip: offset,
      take: limit,
    });

    const totalCount = await this.prisma.recognition.count({
      where: whereClause,
    });

    return {
      recognitions,
      totalCount,
      hasMore: offset + limit < totalCount,
    };
  }

  async updateRecognitionPrivacy(recognitionId: string, senderId: string, updateDto: UpdateRecognitionPrivacyDto) {
    const recognition = await this.prisma.recognition.findUnique({
      where: { id: recognitionId },
    });

    if (!recognition) {
      throw new NotFoundException('Recognition not found');
    }

    if (recognition.senderId !== senderId) {
      throw new BadRequestException('You can only update your own recognitions');
    }

    const updatedRecognition = await this.prisma.recognition.update({
      where: { id: recognitionId },
      data: { isPrivate: updateDto.isPrivate },
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
    });

    return updatedRecognition;
  }

  async getRecognitionById(id: string, userId: string) {
    const recognition = await this.prisma.recognition.findUnique({
      where: { id },
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
    });

    if (!recognition) {
      throw new NotFoundException('Recognition not found');
    }

    // Check if user has permission to view this recognition
    if (recognition.isPrivate && recognition.senderId !== userId && recognition.recipientId !== userId) {
      throw new BadRequestException('You do not have permission to view this recognition');
    }

    return recognition;
  }

  async getRecognitionStatistics(userId?: string) {
    const whereClause = userId ? { 
      OR: [
        { senderId: userId },
        { recipientId: userId },
      ],
    } : {};

    const [totalRecognitions, thisMonthRecognitions, topRecognizers, topRecipients] = await Promise.all([
      this.prisma.recognition.count({ where: whereClause }),
      this.prisma.recognition.count({
        where: {
          ...whereClause,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      this.prisma.recognition.groupBy({
        by: ['senderId'],
        _count: { id: true },
        _sum: { pointsAmount: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      this.prisma.recognition.groupBy({
        by: ['recipientId'],
        _count: { id: true },
        _sum: { pointsAmount: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    return {
      totalRecognitions,
      thisMonthRecognitions,
      topRecognizers,
      topRecipients,
    };
  }

  async deleteRecognition(recognitionId: string, userId: string) {
    const recognition = await this.prisma.recognition.findUnique({
      where: { id: recognitionId },
    });

    if (!recognition) {
      throw new NotFoundException('Recognition not found');
    }

    if (recognition.senderId !== userId) {
      throw new BadRequestException('You can only delete your own recognitions');
    }

    await this.prisma.recognition.delete({
      where: { id: recognitionId },
    });

    return { message: 'Recognition deleted successfully' };
  }
}