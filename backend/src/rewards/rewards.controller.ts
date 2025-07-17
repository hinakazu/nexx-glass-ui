import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Request,
  ParseBoolPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { Role, RedemptionStatus } from '@prisma/client';

@Controller('rewards')
@UseGuards(JwtAuthGuard)
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get()
  async getAllRewards(
    @Query('active', new DefaultValuePipe(true), ParseBoolPipe) activeOnly: boolean,
  ) {
    return this.rewardsService.getAllRewards(activeOnly);
  }

  @Get('statistics')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async getRewardsStatistics() {
    return this.rewardsService.getRewardsStatistics();
  }

  @Get('redemptions')
  async getUserRedemptions(@Request() req) {
    return this.rewardsService.getUserRedemptions(req.user.userId);
  }

  @Get('redemptions/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async getAllRedemptions() {
    return this.rewardsService.getAllRedemptions();
  }

  @Get(':id')
  async getRewardById(@Param('id') id: string) {
    return this.rewardsService.getRewardById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async createReward(@Body() createRewardDto: CreateRewardDto) {
    return this.rewardsService.createReward(createRewardDto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async updateReward(
    @Param('id') id: string,
    @Body() updateRewardDto: UpdateRewardDto,
  ) {
    return this.rewardsService.updateReward(id, updateRewardDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async deleteReward(@Param('id') id: string) {
    return this.rewardsService.deleteReward(id);
  }

  @Post(':id/redeem')
  async redeemReward(@Param('id') id: string, @Request() req) {
    return this.rewardsService.redeemReward(req.user.userId, id);
  }

  @Put('redemptions/:id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async updateRedemptionStatus(
    @Param('id') id: string,
    @Body() body: { status: RedemptionStatus },
  ) {
    return this.rewardsService.updateRedemptionStatus(id, body.status);
  }

  @Get('redemptions/:id')
  async getRedemptionById(@Param('id') id: string) {
    return this.rewardsService.getRedemptionById(id);
  }
}