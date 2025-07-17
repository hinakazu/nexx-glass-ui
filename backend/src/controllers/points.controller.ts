import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PointsService } from '../services/points.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('points')
@UseGuards(JwtAuthGuard)
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('balance')
  async getBalance(@Request() req) {
    return this.pointsService.getUserPointsBalance(req.user.userId);
  }

  @Get('history')
  async getPointsHistory(@Query('limit') limit: string = '50', @Request() req) {
    return this.pointsService.getUserPointsHistory(req.user.userId, parseInt(limit));
  }

  @Get('statistics')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async getPointsStatistics() {
    return this.pointsService.getPointsStatistics();
  }

  @Post('allocate')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async triggerMonthlyAllocation() {
    await this.pointsService.triggerMonthlyAllocation();
    return { message: 'Monthly points allocation triggered successfully' };
  }

  @Put('users/:userId/allocation')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async updateUserAllocation(
    @Param('userId') userId: string,
    @Body() body: { monthlyAllocation: number },
  ) {
    return this.pointsService.updateUserMonthlyAllocation(userId, body.monthlyAllocation);
  }

  @Post('users/:userId/add')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async addPointsToUser(
    @Param('userId') userId: string,
    @Body() body: { amount: number; description: string },
  ) {
    return this.pointsService.addPoints(userId, body.amount, body.description);
  }
}