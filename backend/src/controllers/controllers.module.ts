import { Module } from '@nestjs/common';
import { PointsController } from './points.controller';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [ServicesModule],
  controllers: [PointsController],
})
export class ControllersModule {}