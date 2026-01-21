import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PastPaper } from './entities/past-paper.entity';
import { CreatePastPaperDto } from './dto/create-past-paper.dto';
import { UpdatePastPaperDto } from './dto/update-past-paper.dto';
import { CloudinaryStorageService } from '../storage/cloudinary-storage.service';
import { User, UserRole } from '../users/entities/user.entity';
import { EducationLevel } from '../books/entities/book.entity';

@Injectable()
export class PastPapersService {
  constructor(
    @InjectRepository(PastPaper)
    private pastPapersRepository: Repository<PastPaper>,
    private cloudinaryStorage: CloudinaryStorageService,
  ) {}

  async create(createPastPaperDto: CreatePastPaperDto, uploadedBy: User): Promise<PastPaper> {
    const pastPaper = this.pastPapersRepository.create({
      ...createPastPaperDto,
      uploadedBy,
      uploadedById: uploadedBy.id,
    });

    return await this.pastPapersRepository.save(pastPaper);
  }

  async findAll(
    page: number = 1,
    limit: number = 12,
    level?: EducationLevel,
    category?: string,
    classFilter?: string,
    year?: number,
    subject?: string,
    examinationBody?: string,
    search?: string,
  ): Promise<{ data: PastPaper[]; total: number; page: number; totalPages: number }> {
    const query = this.pastPapersRepository.createQueryBuilder('pastPaper')
      .leftJoinAndSelect('pastPaper.uploadedBy', 'uploadedBy')
      .orderBy('pastPaper.year', 'DESC')
      .addOrderBy('pastPaper.createdAt', 'DESC');

    if (level) {
      query.andWhere('pastPaper.level = :level', { level });
    }

    if (category && category !== 'all') {
      query.andWhere('pastPaper.category = :category', { category });
    }

    if (classFilter && classFilter !== 'all') {
      query.andWhere('pastPaper.class = :classFilter', { classFilter });
    }

    if (year) {
      query.andWhere('pastPaper.year = :year', { year });
    }

    if (subject) {
      query.andWhere('pastPaper.subject = :subject', { subject });
    }

    if (examinationBody) {
      query.andWhere('pastPaper.examinationBody = :examinationBody', { examinationBody });
    }

    if (search) {
      query.andWhere('(pastPaper.title LIKE :search OR pastPaper.description LIKE :search)', {
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

  async findOne(id: string): Promise<PastPaper> {
    const pastPaper = await this.pastPapersRepository.findOne({
      where: { id },
      relations: ['uploadedBy'],
    });

    if (!pastPaper) {
      throw new NotFoundException(`Past paper with ID ${id} not found`);
    }

    // Increment view count
    pastPaper.viewCount += 1;
    await this.pastPapersRepository.save(pastPaper);

    return pastPaper;
  }

  async update(id: string, updatePastPaperDto: UpdatePastPaperDto, currentUser: User): Promise<PastPaper> {
    const pastPaper = await this.findOne(id);

    if (pastPaper.uploadedById !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own past papers');
    }

    Object.assign(pastPaper, updatePastPaperDto);
    return await this.pastPapersRepository.save(pastPaper);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const pastPaper = await this.findOne(id);

    if (pastPaper.uploadedById !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only delete your own past papers');
    }

    // Delete files from Cloudinary
    if (pastPaper.fileUrl) {
      try {
        await this.cloudinaryStorage.deleteFile(pastPaper.fileUrl);
      } catch (error) {
        console.error('Failed to delete file from Cloudinary:', error);
      }
    }

    if (pastPaper.thumbnailUrl) {
      try {
        await this.cloudinaryStorage.deleteFile(pastPaper.thumbnailUrl);
      } catch (error) {
        console.error('Failed to delete thumbnail from Cloudinary:', error);
      }
    }

    await this.pastPapersRepository.remove(pastPaper);
  }

  async uploadFile(
  id: string, 
  file: Express.Multer.File, 
  currentUser: User,
  isThumbnail: boolean = false,
): Promise<PastPaper> {
  const pastPaper = await this.findOne(id);

  if (pastPaper.uploadedById !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
    throw new ForbiddenException('You can only upload files to your own past papers');
  }

  // Check file type
  const allowedTypes = isThumbnail 
    ? ['jpg', 'jpeg', 'png', 'gif', 'webp']
    : ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'];
  
  const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
  
  if (!fileExtension || !allowedTypes.includes(fileExtension)) {
    throw new BadRequestException(
      `Invalid file type. Allowed types for ${isThumbnail ? 'thumbnail' : 'past paper'}: ${allowedTypes.join(', ')}`,
    );
  }

  const folder = isThumbnail ? 'past-paper-thumbnails' : 'past-papers';
  
  // Get the upload result and extract just the URL
  const uploadResult = await this.cloudinaryStorage.uploadFile(file, folder);
  const fileUrl = uploadResult.url; // Extract the URL string

  // Delete old file if exists
  if (isThumbnail && pastPaper.thumbnailUrl) {
    try {
      await this.cloudinaryStorage.deleteFile(pastPaper.thumbnailUrl);
    } catch (error) {
      console.error('Failed to delete old thumbnail from Cloudinary:', error);
    }
    pastPaper.thumbnailUrl = fileUrl;
  } else if (!isThumbnail && pastPaper.fileUrl) {
    try {
      await this.cloudinaryStorage.deleteFile(pastPaper.fileUrl);
    } catch (error) {
      console.error('Failed to delete old file from Cloudinary:', error);
    }
    pastPaper.fileUrl = fileUrl;
    pastPaper.fileName = file.originalname;
  } else if (!isThumbnail) {
    pastPaper.fileUrl = fileUrl;
    pastPaper.fileName = file.originalname;
  } else {
    pastPaper.thumbnailUrl = fileUrl;
  }

  return await this.pastPapersRepository.save(pastPaper);
}

  async incrementDownloadCount(id: string): Promise<PastPaper> {
    const pastPaper = await this.findOne(id);
    pastPaper.downloadCount += 1;
    return await this.pastPapersRepository.save(pastPaper);
  }

  async getCategories(level?: EducationLevel): Promise<{ category: string; count: number }[]> {
    const query = this.pastPapersRepository
      .createQueryBuilder('pastPaper')
      .select('pastPaper.category', 'category')
      .addSelect('COUNT(pastPaper.id)', 'count')
      .groupBy('pastPaper.category');

    if (level) {
      query.where('pastPaper.level = :level', { level });
    }

    const results = await query.getRawMany();
    return results;
  }

  async getClasses(level?: EducationLevel): Promise<{ class: string; count: number }[]> {
    const query = this.pastPapersRepository
      .createQueryBuilder('pastPaper')
      .select('pastPaper.class', 'class')
      .addSelect('COUNT(pastPaper.id)', 'count')
      .groupBy('pastPaper.class');

    if (level) {
      query.where('pastPaper.level = :level', { level });
    }

    const results = await query.getRawMany();
    return results.sort((a, b) => {
      const aNum = parseInt(a.class.replace(/\D/g, ''));
      const bNum = parseInt(b.class.replace(/\D/g, ''));
      return aNum - bNum;
    });
  }

  async getYears(level?: EducationLevel): Promise<{ year: number; count: number }[]> {
    const query = this.pastPapersRepository
      .createQueryBuilder('pastPaper')
      .select('pastPaper.year', 'year')
      .addSelect('COUNT(pastPaper.id)', 'count')
      .groupBy('pastPaper.year')
      .orderBy('pastPaper.year', 'DESC');

    if (level) {
      query.where('pastPaper.level = :level', { level });
    }

    const results = await query.getRawMany();
    return results;
  }

  async getExaminationBodies(level?: EducationLevel): Promise<{ examinationBody: string; count: number }[]> {
    const query = this.pastPapersRepository
      .createQueryBuilder('pastPaper')
      .select('pastPaper.examinationBody', 'examinationBody')
      .addSelect('COUNT(pastPaper.id)', 'count')
      .where('pastPaper.examinationBody IS NOT NULL')
      .groupBy('pastPaper.examinationBody');

    if (level) {
      query.andWhere('pastPaper.level = :level', { level });
    }

    const results = await query.getRawMany();
    return results;
  }

  async getLatest(level?: EducationLevel, limit: number = 10): Promise<PastPaper[]> {
    const query = this.pastPapersRepository.createQueryBuilder('pastPaper')
      .leftJoinAndSelect('pastPaper.uploadedBy', 'uploadedBy')
      .orderBy('pastPaper.createdAt', 'DESC')
      .take(limit);

    if (level) {
      query.where('pastPaper.level = :level', { level });
    }

    return await query.getMany();
  }

  async getStats(): Promise<{
    totalPastPapers: number;
    totalDownloads: number;
    totalViews: number;
    pastPapersByLevel: { level: EducationLevel; count: number }[];
    pastPapersByYear: { year: number; count: number }[];
  }> {
    const totalPastPapers = await this.pastPapersRepository.count();
    
    const totalDownloads = await this.pastPapersRepository
      .createQueryBuilder('pastPaper')
      .select('SUM(pastPaper.downloadCount)', 'total')
      .getRawOne();

    const totalViews = await this.pastPapersRepository
      .createQueryBuilder('pastPaper')
      .select('SUM(pastPaper.viewCount)', 'total')
      .getRawOne();

    const pastPapersByLevel = await this.pastPapersRepository
      .createQueryBuilder('pastPaper')
      .select('pastPaper.level', 'level')
      .addSelect('COUNT(pastPaper.id)', 'count')
      .groupBy('pastPaper.level')
      .getRawMany();

    const pastPapersByYear = await this.pastPapersRepository
      .createQueryBuilder('pastPaper')
      .select('pastPaper.year', 'year')
      .addSelect('COUNT(pastPaper.id)', 'count')
      .groupBy('pastPaper.year')
      .orderBy('pastPaper.year', 'DESC')
      .getRawMany();

    return {
      totalPastPapers,
      totalDownloads: parseInt(totalDownloads.total) || 0,
      totalViews: parseInt(totalViews.total) || 0,
      pastPapersByLevel,
      pastPapersByYear,
    };
  }
}