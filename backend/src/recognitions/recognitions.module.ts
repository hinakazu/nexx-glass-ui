import { Module } from '@nestjs/common';
import { RecognitionsService } from './recognitions.service';
import { RecognitionsController } from './recognitions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [PrismaModule, ServicesModule],
  controllers: [RecognitionsController],
  providers: [RecognitionsService],
  exports: [RecognitionsService],
})
export class RecognitionsModule {}