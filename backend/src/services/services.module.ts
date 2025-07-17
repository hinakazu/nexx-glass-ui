import { Module } from '@nestjs/common';
import { PointsService } from './points.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PointsService],
  exports: [PointsService],
})
export class ServicesModule {}