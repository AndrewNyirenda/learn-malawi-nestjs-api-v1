// src/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User } from '../users/entities/user.entity';
import { Book } from '../books/entities/book.entity';
import { PastPaper } from '../past-papers/entities/past-paper.entity';
import { Tutorial } from '../tutorials/entities/tutorial.entity';
import { Quiz } from '../quizzes/entities/quiz.entity';
import { News } from '../news/entities/news.entity';
import { Message } from '../messages/entities/message.entity';
import { CareerResource } from '../career-resources/entities/career-resource.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Book,
      PastPaper,
      Tutorial,
      Quiz,
      News,
      Message,
      CareerResource
    ])
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService]
})
export class DashboardModule {}