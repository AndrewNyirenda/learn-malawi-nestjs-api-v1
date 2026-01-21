// src/past-papers/past-papers.controller.ts
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
  NotFoundException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PastPapersService } from './past-papers.service';
import { CreatePastPaperDto } from './dto/create-past-paper.dto';
import { UpdatePastPaperDto } from './dto/update-past-paper.dto';
import { PastPaperResponseDto } from './dto/past-paper-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../users/entities/user.entity';
import { User } from '../common/decorators/user.decorator';
import { EducationLevel } from '../books/entities/book.entity';
import { plainToInstance } from 'class-transformer';
import { bookMulterConfig, imageMulterConfig } from '../config/multer.config';

@Controller('past-papers')
export class PastPapersController {
  constructor(private readonly pastPapersService: PastPapersService) {}

  private toResponseDto(pastPaper: any): PastPaperResponseDto {
    return plainToInstance(PastPaperResponseDto, {
      ...pastPaper,
      uploadedBy: {
        id: pastPaper.uploadedBy?.id,
        firstName: pastPaper.uploadedBy?.firstName,
        lastName: pastPaper.uploadedBy?.lastName,
        email: pastPaper.uploadedBy?.email,
      },
    }, {
      excludeExtraneousValues: false,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async create(
    @Body() createPastPaperDto: CreatePastPaperDto,
    @User() user,
  ): Promise<PastPaperResponseDto> {
    const pastPaper = await this.pastPapersService.create(createPastPaperDto, user);
    return this.toResponseDto(pastPaper);
  }

  @Get()
  @Public()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 12,
    @Query('level') level?: EducationLevel,
    @Query('category') category?: string,
    @Query('class') classFilter?: string,
    @Query('year') year?: number,
    @Query('subject') subject?: string,
    @Query('examinationBody') examinationBody?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.pastPapersService.findAll(
      page,
      limit,
      level,
      category,
      classFilter,
      year,
      subject,
      examinationBody,
      search,
    );

    return {
      ...result,
      data: result.data.map(pastPaper => this.toResponseDto(pastPaper)),
    };
  }

  @Get('categories')
  @Public()
  async getCategories(@Query('level') level?: EducationLevel) {
    return await this.pastPapersService.getCategories(level);
  }

  @Get('classes')
  @Public()
  async getClasses(@Query('level') level?: EducationLevel) {
    return await this.pastPapersService.getClasses(level);
  }

  @Get('years')
  @Public()
  async getYears(@Query('level') level?: EducationLevel) {
    return await this.pastPapersService.getYears(level);
  }

  @Get('examination-bodies')
  @Public()
  async getExaminationBodies(@Query('level') level?: EducationLevel) {
    return await this.pastPapersService.getExaminationBodies(level);
  }

  @Get('latest')
  @Public()
  async getLatest(
    @Query('level') level?: EducationLevel,
    @Query('limit') limit: number = 10,
  ) {
    const pastPapers = await this.pastPapersService.getLatest(level, limit);
    return pastPapers.map(pastPaper => this.toResponseDto(pastPaper));
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getStats() {
    return await this.pastPapersService.getStats();
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string): Promise<PastPaperResponseDto> {
    const pastPaper = await this.pastPapersService.findOne(id);
    return this.toResponseDto(pastPaper);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updatePastPaperDto: UpdatePastPaperDto,
    @User() user,
  ): Promise<PastPaperResponseDto> {
    const pastPaper = await this.pastPapersService.update(id, updatePastPaperDto, user);
    return this.toResponseDto(pastPaper);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @User() user): Promise<void> {
    await this.pastPapersService.remove(id, user);
  }

  @Post(':id/file')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', bookMulterConfig))
  async uploadFile(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB for past papers
          new FileTypeValidator({ fileType: /(pdf|doc|docx|ppt|pptx|txt)$/ }),
        ],
      }),
    ) file: Express.Multer.File,
    @User() user,
  ): Promise<PastPaperResponseDto> {
    const pastPaper = await this.pastPapersService.uploadFile(id, file, user, false);
    return this.toResponseDto(pastPaper);
  }

  @Post(':id/thumbnail')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('thumbnail', imageMulterConfig))
  async uploadThumbnail(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB for thumbnails
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/ }),
        ],
      }),
    ) file: Express.Multer.File,
    @User() user,
  ): Promise<PastPaperResponseDto> {
    const pastPaper = await this.pastPapersService.uploadFile(id, file, user, true);
    return this.toResponseDto(pastPaper);
  }

  @Post(':id/download')
  @Public()
  async download(@Param('id') id: string): Promise<{ downloadUrl: string; fileName: string }> {
    const pastPaper = await this.pastPapersService.incrementDownloadCount(id);
    
    if (!pastPaper.fileUrl || !pastPaper.fileName) {
      throw new NotFoundException('Past paper file not found');
    }
    
    return {
      downloadUrl: pastPaper.fileUrl,
      fileName: pastPaper.fileName,
    };
  }

  @Delete(':id/file')
  @UseGuards(JwtAuthGuard)
  async removeFile(@Param('id') id: string, @User() user): Promise<PastPaperResponseDto> {
    const pastPaper = await this.pastPapersService.findOne(id);

    if (pastPaper.uploadedById !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only remove files from your own past papers');
    }

    if (pastPaper.fileUrl) {
      try {
        // Delete from Cloudinary
        const cloudinaryService = this.pastPapersService['cloudinaryStorage'];
        await cloudinaryService.deleteFile(pastPaper.fileUrl);
      } catch (error) {
        console.error('Failed to delete file from Cloudinary:', error);
      }

      // Use repository update method instead of direct assignment
      await this.pastPapersService['pastPapersRepository'].update(id, {
        fileUrl: undefined,
        fileName: undefined,
      });
      
      // Refresh the past paper object
      return this.toResponseDto(await this.pastPapersService.findOne(id));
    }

    return this.toResponseDto(pastPaper);
  }

  @Delete(':id/thumbnail')
  @UseGuards(JwtAuthGuard)
  async removeThumbnail(@Param('id') id: string, @User() user): Promise<PastPaperResponseDto> {
    const pastPaper = await this.pastPapersService.findOne(id);

    if (pastPaper.uploadedById !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only remove thumbnails from your own past papers');
    }

    if (pastPaper.thumbnailUrl) {
      try {
        // Delete from Cloudinary
        const cloudinaryService = this.pastPapersService['cloudinaryStorage'];
        await cloudinaryService.deleteFile(pastPaper.thumbnailUrl);
      } catch (error) {
        console.error('Failed to delete thumbnail from Cloudinary:', error);
      }

      // Use repository update method instead of direct assignment
      await this.pastPapersService['pastPapersRepository'].update(id, {
        thumbnailUrl: undefined,
      });
      
      // Refresh the past paper object
      return this.toResponseDto(await this.pastPapersService.findOne(id));
    }

    return this.toResponseDto(pastPaper);
  }
}