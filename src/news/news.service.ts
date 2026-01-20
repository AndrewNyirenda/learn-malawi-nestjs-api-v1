import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News, NewsCategory } from './entities/news.entity';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { CloudinaryStorageService } from '../storage/cloudinary-storage.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News)
    private newsRepository: Repository<News>,
    private cloudinaryStorage: CloudinaryStorageService,
  ) {}

  async create(createNewsDto: CreateNewsDto, author: User): Promise<News> {
    // Calculate read time if not provided
    let readTime = createNewsDto.readTime;
    if (!readTime) {
      readTime = this.calculateReadTime(createNewsDto.content);
    }

    const news = this.newsRepository.create({
      ...createNewsDto,
      readTime,
      author,
      authorId: author.id,
      publishedAt: createNewsDto.isPublished ? new Date() : null,
    });

    return await this.newsRepository.save(news);
  }

  private calculateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    category?: NewsCategory,
    authorId?: string,
    isPublished?: boolean,
  ): Promise<{ data: News[]; total: number; page: number; totalPages: number }> {
    const query = this.newsRepository.createQueryBuilder('news')
      .leftJoinAndSelect('news.author', 'author')
      .orderBy('news.createdAt', 'DESC');

    if (category) {
      query.andWhere('news.category = :category', { category });
    }

    if (authorId) {
      query.andWhere('news.authorId = :authorId', { authorId });
    }

    if (isPublished !== undefined) {
      query.andWhere('news.isPublished = :isPublished', { isPublished });
    }

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, checkPublished: boolean = false): Promise<News> {
    const news = await this.newsRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!news) {
      throw new NotFoundException(`News with ID ${id} not found`);
    }

    if (checkPublished && !news.isPublished) {
      throw new NotFoundException(`News with ID ${id} is not published`);
    }

    return news;
  }

  async update(id: string, updateNewsDto: UpdateNewsDto, currentUser: User): Promise<News> {
    const news = await this.findOne(id);

    if (news.authorId !== currentUser.id && currentUser.role !== 'Admin') {
      throw new ForbiddenException('You can only update your own news articles');
    }

    // Calculate read time if content is being updated and no readTime provided
    if (updateNewsDto.content && !updateNewsDto.readTime) {
      updateNewsDto.readTime = this.calculateReadTime(updateNewsDto.content);
    }

    const updateData: any = { ...updateNewsDto };

    if (updateNewsDto.isPublished === true && !news.isPublished) {
      updateData.publishedAt = new Date();
    } else if (updateNewsDto.isPublished === false && news.isPublished) {
      updateData.publishedAt = null;
    }

    Object.assign(news, updateData);
    return await this.newsRepository.save(news);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const news = await this.findOne(id);

    if (news.authorId !== currentUser.id && currentUser.role !== 'Admin') {
      throw new ForbiddenException('You can only delete your own news articles');
    }

    if (news.imageUrl) {
      try {
        await this.cloudinaryStorage.deleteFile(news.imageUrl);
      } catch (error) {
        console.error('Failed to delete image from Cloudinary:', error);
      }
    }

    await this.newsRepository.remove(news);
  }

  async uploadImage(id: string, file: Express.Multer.File, currentUser: User): Promise<News> {
    const news = await this.findOne(id);

    if (news.authorId !== currentUser.id && currentUser.role !== 'Admin') {
      throw new ForbiddenException('You can only upload images to your own news articles');
    }

    if (news.imageUrl) {
      try {
        await this.cloudinaryStorage.deleteFile(news.imageUrl);
      } catch (error) {
        console.error('Failed to delete old image from Cloudinary:', error);
      }
    }

    const imageUrl = await this.cloudinaryStorage.uploadFile(file, 'news-images');

    news.imageUrl = imageUrl;
    return await this.newsRepository.save(news);
  }

  async removeImage(id: string, currentUser: User): Promise<News> {
    const news = await this.findOne(id);

    if (news.authorId !== currentUser.id && currentUser.role !== 'Admin') {
      throw new ForbiddenException('You can only remove images from your own news articles');
    }

    if (!news.imageUrl) {
      throw new BadRequestException('News article does not have an image');
    }

    try {
      await this.cloudinaryStorage.deleteFile(news.imageUrl);
    } catch (error) {
      console.error('Failed to delete image from Cloudinary:', error);
    }

    news.imageUrl = null;
    return await this.newsRepository.save(news);
  }

  async getCategories(): Promise<{ category: NewsCategory; count: number }[]> {
    const results = await this.newsRepository
      .createQueryBuilder('news')
      .select('news.category', 'category')
      .addSelect('COUNT(news.id)', 'count')
      .where('news.isPublished = :isPublished', { isPublished: true })
      .groupBy('news.category')
      .getRawMany();

    return results;
  }

  async getLatestPublished(limit: number = 5): Promise<News[]> {
    return await this.newsRepository.find({
      where: { isPublished: true },
      relations: ['author'],
      order: { publishedAt: 'DESC' },
      take: limit,
    });
  }
}