// src/books/books.controller.ts
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
  HttpCode,
  HttpStatus,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BookResponseDto } from './dto/book-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../users/entities/user.entity';
import { User } from '../common/decorators/user.decorator';
import { EducationLevel } from './entities/book.entity';
import { plainToInstance } from 'class-transformer';
import {
  bookMulterConfig,
  imageMulterConfig,
} from '../config/multer.config';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  private toResponseDto(book: any): BookResponseDto {
    return plainToInstance(
      BookResponseDto,
      {
        ...book,
        uploadedBy: book.uploadedBy
          ? {
              id: book.uploadedBy.id,
              firstName: book.uploadedBy.firstName,
              lastName: book.uploadedBy.lastName,
              email: book.uploadedBy.email,
            }
          : null,
      },
      { excludeExtraneousValues: false },
    );
  }

  /* =========================
     CREATE BOOK
  ========================= */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async create(
    @Body() createBookDto: CreateBookDto,
    @User() user,
  ): Promise<BookResponseDto> {
    const book = await this.booksService.create(createBookDto, user);
    return this.toResponseDto(book);
  }

  /* =========================
     LIST BOOKS
  ========================= */
  @Get()
  @Public()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 12,
    @Query('level') level?: EducationLevel,
    @Query('category') category?: string,
    @Query('class') classFilter?: string,
    @Query('subject') subject?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.booksService.findAll(
      page,
      limit,
      level,
      category,
      classFilter,
      subject,
      search,
    );

    return {
      ...result,
      data: result.data.map(book => this.toResponseDto(book)),
    };
  }

  /* =========================
     METADATA
  ========================= */
  @Get('categories')
  @Public()
  getCategories(@Query('level') level?: EducationLevel) {
    return this.booksService.getCategories(level);
  }

  @Get('classes')
  @Public()
  getClasses(@Query('level') level?: EducationLevel) {
    return this.booksService.getClasses(level);
  }

  @Get('subjects')
  @Public()
  getSubjects(@Query('level') level?: EducationLevel) {
    return this.booksService.getSubjects(level);
  }

  @Get('latest')
  @Public()
  async getLatest(
    @Query('level') level?: EducationLevel,
    @Query('limit') limit = 10,
  ) {
    const books = await this.booksService.getLatest(level, limit);
    return books.map(book => this.toResponseDto(book));
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getStats() {
    return this.booksService.getStats();
  }

  /* =========================
     SINGLE BOOK
  ========================= */
  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string): Promise<BookResponseDto> {
    const book = await this.booksService.findOne(id);
    return this.toResponseDto(book);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto,
    @User() user,
  ): Promise<BookResponseDto> {
    const book = await this.booksService.update(id, updateBookDto, user);
    return this.toResponseDto(book);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @User() user): Promise<void> {
    await this.booksService.remove(id, user);
  }

  /* =========================
     BOOK FILE UPLOAD (PDF)
  ========================= */
  @Post(':id/file')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', bookMulterConfig))
  async uploadFile(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(pdf|doc|docx|ppt|pptx|txt)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @User() user,
  ): Promise<BookResponseDto> {
    const book = await this.booksService.uploadFile(id, file, user, false);
    return this.toResponseDto(book);
  }

  /* =========================
     THUMBNAIL UPLOAD (IMAGE)
  ========================= */
  @Post(':id/thumbnail')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('thumbnail', imageMulterConfig))
  async uploadThumbnail(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @User() user,
  ): Promise<BookResponseDto> {
    const book = await this.booksService.uploadFile(id, file, user, true);
    return this.toResponseDto(book);
  }

  /* =========================
     VIEW PDF IN BROWSER
  ========================= */
  @Post(':id/view')
  @Public()
  async getViewUrl(
    @Param('id') id: string,
  ): Promise<{ viewUrl: string; fileName: string }> {
    return await this.booksService.getViewUrl(id);
  }

  /* =========================
     DOWNLOAD PDF
  ========================= */
  @Post(':id/download')
  @Public()
  async download(
    @Param('id') id: string,
  ): Promise<{ downloadUrl: string; fileName: string }> {
    return await this.booksService.getDownloadUrl(id);
  }

  /* =========================
     REMOVE FILE
  ========================= */
  @Delete(':id/file')
  @UseGuards(JwtAuthGuard)
  async removeFile(
    @Param('id') id: string,
    @User() user,
  ): Promise<BookResponseDto> {
    const book = await this.booksService.findOne(id);

    if (book.uploadedById !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You can only remove files from your own books',
      );
    }

    await this.booksService.removeBookFile(id);
    return this.toResponseDto(await this.booksService.findOne(id));
  }

  /* =========================
     REMOVE THUMBNAIL
  ========================= */
  @Delete(':id/thumbnail')
  @UseGuards(JwtAuthGuard)
  async removeThumbnail(
    @Param('id') id: string,
    @User() user,
  ): Promise<BookResponseDto> {
    const book = await this.booksService.findOne(id);

    if (book.uploadedById !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You can only remove thumbnails from your own books',
      );
    }

    await this.booksService.removeThumbnail(id);
    return this.toResponseDto(await this.booksService.findOne(id));
  }
}