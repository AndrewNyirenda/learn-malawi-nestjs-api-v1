import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';

import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsResponseDto } from './dto/news-response.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '../common/decorators/user.decorator';

import { UserRole } from '../users/entities/user.entity';
import { NewsCategory } from './entities/news.entity';

/**
 * IMPORTANT:
 * Use IMAGE-ONLY multer config for news images
 */
import { imageMulterConfig } from '../config/multer.config';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  /* -------------------- HELPERS -------------------- */
  private toResponseDto(news: any): NewsResponseDto {
    return plainToInstance(
      NewsResponseDto,
      {
        ...news,
        author: news.author
          ? {
              id: news.author.id,
              firstName: news.author.firstName,
              lastName: news.author.lastName,
              email: news.author.email,
            }
          : null,
      },
      { excludeExtraneousValues: false },
    );
  }

  /* -------------------- CREATE -------------------- */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async create(
    @Body() createNewsDto: CreateNewsDto,
    @User() user,
  ): Promise<NewsResponseDto> {
    const news = await this.newsService.create(createNewsDto, user);
    return this.toResponseDto(news);
  }

  /* -------------------- READ -------------------- */
  @Get()
  @Public()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('category') category?: NewsCategory,
    @Query('authorId') authorId?: string,
    @Query('published') published?: string,
  ) {
    const isPublished =
      published === 'true'
        ? true
        : published === 'false'
        ? false
        : undefined;

    const result = await this.newsService.findAll(
      page,
      limit,
      category,
      authorId,
      isPublished,
    );

    return {
      ...result,
      data: result.data.map(news => this.toResponseDto(news)),
    };
  }

  @Get('categories')
  @Public()
  async getCategories() {
    return await this.newsService.getCategories();
  }

  @Get('latest')
  @Public()
  async getLatest(@Query('limit') limit: number = 5) {
    const news = await this.newsService.getLatestPublished(limit);
    return news.map(item => this.toResponseDto(item));
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string): Promise<NewsResponseDto> {
    const news = await this.newsService.findOne(id, true);
    return this.toResponseDto(news);
  }

  /* -------------------- UPDATE -------------------- */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateNewsDto: UpdateNewsDto,
    @User() user,
  ): Promise<NewsResponseDto> {
    const news = await this.newsService.update(id, updateNewsDto, user);
    return this.toResponseDto(news);
  }

  /* -------------------- DELETE -------------------- */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('id') id: string,
    @User() user,
  ): Promise<{ message: string }> {
    await this.newsService.remove(id, user);
    return { message: 'News article deleted successfully' };
  }

  /* -------------------- IMAGE UPLOAD -------------------- */
  @Post(':id/image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image', imageMulterConfig))
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @User() user,
  ): Promise<NewsResponseDto> {
    const news = await this.newsService.uploadImage(id, file, user);
    return this.toResponseDto(news);
  }

  /* -------------------- IMAGE DELETE -------------------- */
  @Delete(':id/image')
  @UseGuards(JwtAuthGuard)
  async removeImage(
    @Param('id') id: string,
    @User() user,
  ): Promise<NewsResponseDto> {
    const news = await this.newsService.removeImage(id, user);
    return this.toResponseDto(news);
  }
}