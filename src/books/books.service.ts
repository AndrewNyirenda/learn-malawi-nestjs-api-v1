import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book, EducationLevel } from './entities/book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { CloudinaryStorageService } from '../storage/cloudinary-storage.service';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private booksRepository: Repository<Book>,
    private cloudinaryStorage: CloudinaryStorageService,
  ) {}

  async create(createBookDto: CreateBookDto, uploadedBy: User): Promise<Book> {
    const book = this.booksRepository.create({
      ...createBookDto,
      uploadedBy,
      uploadedById: uploadedBy.id,
    });

    return await this.booksRepository.save(book);
  }

  async findAll(
    page: number = 1,
    limit: number = 12,
    level?: EducationLevel,
    category?: string,
    classFilter?: string,
    subject?: string,
    search?: string,
  ): Promise<{ data: Book[]; total: number; page: number; totalPages: number }> {
    const query = this.booksRepository.createQueryBuilder('book')
      .leftJoinAndSelect('book.uploadedBy', 'uploadedBy')
      .orderBy('book.createdAt', 'DESC');

    if (level) {
      query.andWhere('book.level = :level', { level });
    }

    if (category && category !== 'all') {
      query.andWhere('book.category = :category', { category });
    }

    if (classFilter && classFilter !== 'all') {
      query.andWhere('book.class = :classFilter', { classFilter });
    }

    if (subject) {
      query.andWhere('book.subject = :subject', { subject });
    }

    if (search) {
      query.andWhere('(book.title LIKE :search OR book.description LIKE :search OR book.author LIKE :search)', {
        search: `%${search}%`,
      });
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

  async findOne(id: string): Promise<Book> {
    const book = await this.booksRepository.findOne({
      where: { id },
      relations: ['uploadedBy'],
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    // Increment view count
    book.viewCount += 1;
    await this.booksRepository.save(book);

    return book;
  }

  async update(id: string, updateBookDto: UpdateBookDto, currentUser: User): Promise<Book> {
    const book = await this.findOne(id);

    if (book.uploadedById !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own books');
    }

    Object.assign(book, updateBookDto);
    return await this.booksRepository.save(book);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const book = await this.findOne(id);

    if (book.uploadedById !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only delete your own books');
    }

    // Delete files from Cloudinary
    if (book.fileUrl) {
      try {
        await this.cloudinaryStorage.deleteFile(book.fileUrl);
      } catch (error) {
        console.error('Failed to delete file from Cloudinary:', error);
      }
    }

    if (book.thumbnailUrl) {
      try {
        await this.cloudinaryStorage.deleteFile(book.thumbnailUrl);
      } catch (error) {
        console.error('Failed to delete thumbnail from Cloudinary:', error);
      }
    }

    await this.booksRepository.remove(book);
  }

  async uploadFile(
    id: string, 
    file: Express.Multer.File, 
    currentUser: User,
    isThumbnail: boolean = false,
  ): Promise<Book> {
    const book = await this.findOne(id);

    if (book.uploadedById !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only upload files to your own books');
    }

    // Check file type
    const allowedTypes = isThumbnail 
      ? ['jpg', 'jpeg', 'png', 'gif', 'webp']
      : ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'];
    
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types for ${isThumbnail ? 'thumbnail' : 'book'}: ${allowedTypes.join(', ')}`,
      );
    }

    const folder = isThumbnail ? 'book-thumbnails' : 'books';
    const fileUrl = await this.cloudinaryStorage.uploadFile(file, folder);

    // Delete old file if exists
    if (isThumbnail && book.thumbnailUrl) {
      try {
        await this.cloudinaryStorage.deleteFile(book.thumbnailUrl);
      } catch (error) {
        console.error('Failed to delete old thumbnail from Cloudinary:', error);
      }
      book.thumbnailUrl = fileUrl;
    } else if (!isThumbnail && book.fileUrl) {
      try {
        await this.cloudinaryStorage.deleteFile(book.fileUrl);
      } catch (error) {
        console.error('Failed to delete old file from Cloudinary:', error);
      }
      book.fileUrl = fileUrl;
      book.fileName = file.originalname;
    } else if (!isThumbnail) {
      book.fileUrl = fileUrl;
      book.fileName = file.originalname;
    } else {
      book.thumbnailUrl = fileUrl;
    }

    return await this.booksRepository.save(book);
  }

  async incrementDownloadCount(id: string): Promise<Book> {
    const book = await this.findOne(id);
    book.downloadCount += 1;
    return await this.booksRepository.save(book);
  }

  async removeBookFile(id: string): Promise<Book> {
    const book = await this.findOne(id);

    if (book.fileUrl) {
      try {
        await this.cloudinaryStorage.deleteFile(book.fileUrl);
      } catch (error) {
        console.error('Failed to delete file from Cloudinary:', error);
      }

      // Use undefined instead of null
      book.fileUrl = undefined;
      book.fileName = undefined;
      return await this.booksRepository.save(book);
    }

    return book;
  }

  async removeThumbnail(id: string): Promise<Book> {
    const book = await this.findOne(id);

    if (book.thumbnailUrl) {
      try {
        await this.cloudinaryStorage.deleteFile(book.thumbnailUrl);
      } catch (error) {
        console.error('Failed to delete thumbnail from Cloudinary:', error);
      }

      // Use undefined instead of null
      book.thumbnailUrl = undefined;
      return await this.booksRepository.save(book);
    }

    return book;
  }

  async getCategories(level?: EducationLevel): Promise<{ category: string; count: number }[]> {
    const query = this.booksRepository
      .createQueryBuilder('book')
      .select('book.category', 'category')
      .addSelect('COUNT(book.id)', 'count')
      .groupBy('book.category');

    if (level) {
      query.where('book.level = :level', { level });
    }

    const results = await query.getRawMany();
    return results;
  }

  async getClasses(level?: EducationLevel): Promise<{ class: string; count: number }[]> {
    const query = this.booksRepository
      .createQueryBuilder('book')
      .select('book.class', 'class')
      .addSelect('COUNT(book.id)', 'count')
      .groupBy('book.class');

    if (level) {
      query.where('book.level = :level', { level });
    }

    const results = await query.getRawMany();
    return results.sort((a, b) => {
      // Sort by class name (Standard 1, Standard 2, Form 1, Form 2, etc.)
      const aNum = parseInt(a.class.replace(/\D/g, ''));
      const bNum = parseInt(b.class.replace(/\D/g, ''));
      return aNum - bNum;
    });
  }

  async getSubjects(level?: EducationLevel): Promise<{ subject: string; count: number }[]> {
    const query = this.booksRepository
      .createQueryBuilder('book')
      .select('book.subject', 'subject')
      .addSelect('COUNT(book.id)', 'count')
      .where('book.subject IS NOT NULL')
      .groupBy('book.subject');

    if (level) {
      query.andWhere('book.level = :level', { level });
    }

    const results = await query.getRawMany();
    return results;
  }

  async getLatest(level?: EducationLevel, limit: number = 10): Promise<Book[]> {
    const query = this.booksRepository.createQueryBuilder('book')
      .leftJoinAndSelect('book.uploadedBy', 'uploadedBy')
      .orderBy('book.createdAt', 'DESC')
      .take(limit);

    if (level) {
      query.where('book.level = :level', { level });
    }

    return await query.getMany();
  }

  async getStats(): Promise<{
    totalBooks: number;
    totalDownloads: number;
    totalViews: number;
    booksByLevel: { level: EducationLevel; count: number }[];
  }> {
    const totalBooks = await this.booksRepository.count();
    
    const totalDownloads = await this.booksRepository
      .createQueryBuilder('book')
      .select('SUM(book.downloadCount)', 'total')
      .getRawOne();

    const totalViews = await this.booksRepository
      .createQueryBuilder('book')
      .select('SUM(book.viewCount)', 'total')
      .getRawOne();

    const booksByLevel = await this.booksRepository
      .createQueryBuilder('book')
      .select('book.level', 'level')
      .addSelect('COUNT(book.id)', 'count')
      .groupBy('book.level')
      .getRawMany();

    return {
      totalBooks,
      totalDownloads: parseInt(totalDownloads.total) || 0,
      totalViews: parseInt(totalViews.total) || 0,
      booksByLevel,
    };
  }
}