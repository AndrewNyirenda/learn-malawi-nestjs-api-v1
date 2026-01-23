// src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Book, EducationLevel } from '../books/entities/book.entity';
import { PastPaper } from '../past-papers/entities/past-paper.entity';
import { Tutorial } from '../tutorials/entities/tutorial.entity';
import { Quiz } from '../quizzes/entities/quiz.entity';
import { News } from '../news/entities/news.entity';
import { Message, MessageStatus } from '../messages/entities/message.entity';
import { CareerResource } from '../career-resources/entities/career-resource.entity';
import { DashboardStatsResponseDto } from './dto/dashboard-stats.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Book)
    private booksRepository: Repository<Book>,
    @InjectRepository(PastPaper)
    private pastPapersRepository: Repository<PastPaper>,
    @InjectRepository(Tutorial)
    private tutorialsRepository: Repository<Tutorial>,
    @InjectRepository(Quiz)
    private quizzesRepository: Repository<Quiz>,
    @InjectRepository(News)
    private newsRepository: Repository<News>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(CareerResource)
    private careerResourcesRepository: Repository<CareerResource>,
  ) {}

  async getDashboardStats(): Promise<DashboardStatsResponseDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Execute all queries in parallel for performance
    const [
      totalUsers,
      totalBooks,
      totalPastPapers,
      totalTutorials,
      totalQuizzes,
      totalNews,
      totalCareerResources,
      totalDownloads,
      totalViews,
      pendingMessages,
      booksByLevel,
      pastPapersByLevel,
      recentActivities
    ] = await Promise.all([
      this.usersRepository.count(),
      this.booksRepository.count(),
      this.pastPapersRepository.count(),
      this.tutorialsRepository.count(),
      this.quizzesRepository.count(),
      this.newsRepository.count(),
      this.careerResourcesRepository.count(),
      this.getTotalDownloads(),
      this.getTotalViews(),
      this.messagesRepository.count({ where: { status: MessageStatus.NEW } }),
      this.getBooksByLevel(),
      this.getPastPapersByLevel(),
      this.getRecentActivity()
    ]);

    // Get today's uploads (only for entities with createdAt)
    const todayUploads = await this.getTodayUploads();

    const totalResources = totalBooks + totalPastPapers + totalTutorials + 
                          totalQuizzes + totalNews + totalCareerResources;

    // Calculate active users (users who logged in today)
    const activeUsersToday = await this.getActiveUsersToday(today);

    const quickStats = [
      { 
        title: 'Study Notes', 
        value: totalBooks, 
        change: await this.calculateChange(this.booksRepository, weekAgo), 
        color: '#4a90e2' 
      },
      { 
        title: 'Past Papers', 
        value: totalPastPapers, 
        change: await this.calculateChange(this.pastPapersRepository, weekAgo), 
        color: '#36b37e' 
      },
      { 
        title: 'Tutorials', 
        value: totalTutorials, 
        change: await this.calculateChange(this.tutorialsRepository, weekAgo), 
        color: '#ff5630' 
      },
      { 
        title: 'Quizzes', 
        value: totalQuizzes, 
        change: await this.calculateChange(this.quizzesRepository, weekAgo), 
        color: '#6554c0' 
      },
      { 
        title: 'News Articles', 
        value: totalNews, 
        change: await this.calculateChange(this.newsRepository, weekAgo), 
        color: '#00b8d9' 
      },
      { 
        title: 'Career Resources', 
        value: totalCareerResources, 
        change: await this.calculateChange(this.careerResourcesRepository, weekAgo), 
        color: '#ffab00' 
      }
    ];

    return {
      summary: {
        totalUsers,
        totalResources,
        totalDownloads,
        totalViews,
        pendingMessages,
        activeSessions: activeUsersToday
      },
      quickStats,
      recentActivity: recentActivities,
      systemStats: {
        booksByLevel,
        pastPapersByLevel,
        activeUsersToday,
        uploadsToday: todayUploads
      }
    };
  }

  private async getActiveUsersToday(today: Date): Promise<number> {
    try {
      return await this.usersRepository
        .createQueryBuilder('user')
        .where('user.lastLogin >= :today', { today: today.toISOString() })
        .getCount();
    } catch {
      return 0; // If User entity doesn't have lastLogin field
    }
  }

  private async getTotalDownloads(): Promise<number> {
    const [booksDownloads, papersDownloads] = await Promise.all([
      this.booksRepository
        .createQueryBuilder('book')
        .select('SUM(book.downloadCount)', 'total')
        .getRawOne(),
      this.pastPapersRepository
        .createQueryBuilder('paper')
        .select('SUM(paper.downloadCount)', 'total')
        .getRawOne()
    ]);

    return (parseInt(booksDownloads?.total) || 0) + 
           (parseInt(papersDownloads?.total) || 0);
  }

  private async getTotalViews(): Promise<number> {
    const [booksViews, papersViews] = await Promise.all([
      this.booksRepository
        .createQueryBuilder('book')
        .select('SUM(book.viewCount)', 'total')
        .getRawOne(),
      this.pastPapersRepository
        .createQueryBuilder('paper')
        .select('SUM(paper.viewCount)', 'total')
        .getRawOne()
    ]);

    return (parseInt(booksViews?.total) || 0) + 
           (parseInt(papersViews?.total) || 0);
  }

  private async getBooksByLevel(): Promise<{ primary: number; secondary: number }> {
    const result = await this.booksRepository
      .createQueryBuilder('book')
      .select('book.level, COUNT(book.id) as count')
      .groupBy('book.level')
      .getRawMany();

    return {
      primary: parseInt(result.find(r => r.level === EducationLevel.PRIMARY)?.count) || 0,
      secondary: parseInt(result.find(r => r.level === EducationLevel.SECONDARY)?.count) || 0
    };
  }

  private async getPastPapersByLevel(): Promise<{ primary: number; secondary: number }> {
    const result = await this.pastPapersRepository
      .createQueryBuilder('paper')
      .select('paper.level, COUNT(paper.id) as count')
      .groupBy('paper.level')
      .getRawMany();

    return {
      primary: parseInt(result.find(r => r.level === EducationLevel.PRIMARY)?.count) || 0,
      secondary: parseInt(result.find(r => r.level === EducationLevel.SECONDARY)?.count) || 0
    };
  }

  private async getTodayUploads(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [booksToday, papersToday] = await Promise.all([
      this.booksRepository
        .createQueryBuilder('book')
        .where('book.createdAt >= :today', { today: today.toISOString() })
        .getCount(),
      
      this.pastPapersRepository
        .createQueryBuilder('paper')
        .where('paper.createdAt >= :today', { today: today.toISOString() })
        .getCount()
    ]);

    // Only count entities that have createdAt columns
    return booksToday + papersToday;
  }

  private async getRecentActivity(): Promise<any[]> {
    // Get recent books
    const books = await this.booksRepository
      .createQueryBuilder('book')
      .select(['book.id', 'book.title', 'book.createdAt', 'user.firstName', 'user.lastName'])
      .leftJoin('book.uploadedBy', 'user')
      .orderBy('book.createdAt', 'DESC')
      .limit(5)
      .getMany();

    // Get recent past papers
    const papers = await this.pastPapersRepository
      .createQueryBuilder('paper')
      .select(['paper.id', 'paper.title', 'paper.createdAt', 'user.firstName', 'user.lastName'])
      .leftJoin('paper.uploadedBy', 'user')
      .orderBy('paper.createdAt', 'DESC')
      .limit(5)
      .getMany();

    // Get recent news
    const news = await this.newsRepository
      .createQueryBuilder('news')
      .select(['news.id', 'news.title', 'news.createdAt', 'author.firstName', 'author.lastName'])
      .leftJoin('news.author', 'author')
      .orderBy('news.createdAt', 'DESC')
      .limit(3)
      .getMany();

    // Combine activities
    const allActivities = [
      ...books.map(b => ({
        id: b.id,
        user: `${b.uploadedBy?.firstName} ${b.uploadedBy?.lastName}` || 'Admin',
        action: 'uploaded study notes',
        resource: b.title,
        time: this.formatTimeAgo(b.createdAt),
        type: 'upload'
      })),
      ...papers.map(p => ({
        id: p.id,
        user: `${p.uploadedBy?.firstName} ${p.uploadedBy?.lastName}` || 'Admin',
        action: 'uploaded past papers',
        resource: p.title,
        time: this.formatTimeAgo(p.createdAt),
        type: 'upload'
      })),
      ...news.map(n => ({
        id: n.id,
        user: `${n.author?.firstName} ${n.author?.lastName}` || 'Admin',
        action: 'published news',
        resource: n.title,
        time: this.formatTimeAgo(n.createdAt),
        type: 'publish'
      }))
    ];

    return allActivities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);
  }

  private async calculateChange(repository: Repository<any>, sinceDate: Date): Promise<string> {
    const totalNow = await repository.count();
    
    // Check if entity has createdAt column
    const hasCreatedAt = repository.metadata.columns.some(col => col.propertyName === 'createdAt');
    
    if (!hasCreatedAt) {
      return totalNow > 0 ? '+0%' : '0%'; // Can't calculate change without timestamp
    }
    
    const totalBefore = await repository
      .createQueryBuilder('entity')
      .where('entity.createdAt >= :start AND entity.createdAt <= :end', {
        start: sinceDate.toISOString(),
        end: new Date().toISOString()
      })
      .getCount();

    if (totalBefore === 0) return totalNow > 0 ? '+100%' : '0%';
    
    const change = ((totalNow - totalBefore) / totalBefore) * 100;
    return change >= 0 ? `+${Math.round(change)}%` : `${Math.round(change)}%`;
  }

  private formatTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return Math.floor(seconds) + ' seconds ago';
  }
}