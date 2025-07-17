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
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { RecognitionsService } from './recognitions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateRecognitionDto } from './dto/create-recognition.dto';
import { UpdateRecognitionPrivacyDto } from './dto/update-recognition-privacy.dto';
import { Role } from '../types/enums';

@Controller('recognitions')
@UseGuards(JwtAuthGuard)
export class RecognitionsController {
  constructor(private readonly recognitionsService: RecognitionsService) {}

  @Post()
  async createRecognition(@Body() createRecognitionDto: CreateRecognitionDto, @Request() req) {
    return this.recognitionsService.createRecognition(req.user.userId, createRecognitionDto);
  }

  @Get('feed')
  async getRecognitionFeed(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.recognitionsService.getRecognitionFeed(limit, offset);
  }

  @Get('user/:userId')
  async getUserRecognitions(
    @Param('userId') userId: string,
    @Query('type') type: 'sent' | 'received' | 'all' = 'all',
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.recognitionsService.getUserRecognitions(userId, type, limit, offset);
  }

  @Get('my')
  async getMyRecognitions(
    @Query('type') type: 'sent' | 'received' | 'all' = 'all',
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Request() req,
  ) {
    return this.recognitionsService.getUserRecognitions(req.user.userId, type, limit, offset);
  }

  @Get('statistics')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async getRecognitionStatistics(@Query('userId') userId?: string) {
    return this.recognitionsService.getRecognitionStatistics(userId);
  }

  @Get(':id')
  async getRecognitionById(@Param('id') id: string, @Request() req) {
    return this.recognitionsService.getRecognitionById(id, req.user.userId);
  }

  @Put(':id/privacy')
  async updateRecognitionPrivacy(
    @Param('id') id: string,
    @Body() updateDto: UpdateRecognitionPrivacyDto,
    @Request() req,
  ) {
    return this.recognitionsService.updateRecognitionPrivacy(id, req.user.userId, updateDto);
  }

  @Delete(':id')
  async deleteRecognition(@Param('id') id: string, @Request() req) {
    return this.recognitionsService.deleteRecognition(id, req.user.userId);
  }
}