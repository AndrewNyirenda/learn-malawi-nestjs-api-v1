// src/career-resources/career-resources.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CareerResourcesService } from './career-resources.service';
import { CareerResourcesController } from './career-resources.controller';
import { CareerResource } from './entities/career-resource.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CareerResource])],
  controllers: [CareerResourcesController],
  providers: [CareerResourcesService],
  exports: [CareerResourcesService],
})
export class CareerResourcesModule {}