import { 
  Controller, 
  Get, 
  Put, 
  Post, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Request, 
  UseInterceptors, 
  UploadedFile, 
  ParseFilePipe, 
  MaxFileSizeValidator, 
  FileTypeValidator 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  async searchUsers(@Query('q') query: string = '', @Request() req) {
    return this.usersService.searchUsers(query, req.user.userId);
  }

  @Get('all')
  async getAllUsers(@Request() req) {
    return this.usersService.getAllUsers(req.user.userId);
  }

  @Get(':id/profile')
  async getUserProfile(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put('profile')
  async updateProfile(@Body() updateData: UpdateUserProfileDto, @Request() req) {
    return this.usersService.updateProfile(req.user.userId, updateData);
  }

  @Get(':id/analytics')
  async getUserAnalytics(@Param('id') id: string, @Request() req) {
    // Users can only access their own analytics unless they're managers/admins
    if (id !== req.user.userId && !['MANAGER', 'ADMIN'].includes(req.user.role)) {
      return this.usersService.getUserAnalytics(req.user.userId);
    }
    return this.usersService.getUserAnalytics(id);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar', {
    storage: diskStorage({
      destination: './uploads/avatars',
      filename: (req, file, cb) => {
        const uniqueSuffix = uuidv4();
        const ext = extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
      },
    }),
  }))
  async uploadAvatar(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /\.(jpg|jpeg|png|gif)$/i }),
        ],
      }),
    )
    file: any,
    @Request() req,
  ) {
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.usersService.updateAvatar(req.user.userId, avatarUrl);
  }
}