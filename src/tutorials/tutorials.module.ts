import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TutorialsService } from './tutorials.service';
import { TutorialsController } from './tutorials.controller';
import { Tutorial } from './entities/tutorial.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tutorial])],
  controllers: [TutorialsController],
  providers: [TutorialsService],
  exports: [TutorialsService],
})
export class TutorialsModule {}