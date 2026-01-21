import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tutorial } from './entities/tutorial.entity';
import { CreateTutorialDto } from './dto/create-tutorial.dto';
import { UpdateTutorialDto } from './dto/update-tutorial.dto';

@Injectable()
export class TutorialsService {
  constructor(
    @InjectRepository(Tutorial)
    private tutorialsRepository: Repository<Tutorial>,
  ) {}

  async create(createTutorialDto: CreateTutorialDto): Promise<Tutorial> {
    const tutorial = this.tutorialsRepository.create(createTutorialDto);
    return await this.tutorialsRepository.save(tutorial);
  }

  async findAll(
    level?: string,
    subject?: string,
    classFilter?: string,
  ): Promise<Tutorial[]> {
    const query = this.tutorialsRepository.createQueryBuilder('tutorial');

    if (level) {
      query.andWhere('tutorial.level = :level', { level });
    }

    if (subject) {
      query.andWhere('tutorial.subject = :subject', { subject });
    }

    if (classFilter) {
      query.andWhere('tutorial.class = :classFilter', { classFilter });
    }

    query.orderBy('tutorial.id', 'ASC');

    return await query.getMany();
  }

  async findOne(id: number): Promise<Tutorial> {
    const tutorial = await this.tutorialsRepository.findOne({
      where: { id },
    });

    if (!tutorial) {
      throw new NotFoundException(`Tutorial with ID ${id} not found`);
    }

    return tutorial;
  }

  async update(id: number, updateTutorialDto: UpdateTutorialDto): Promise<Tutorial> {
    const tutorial = await this.findOne(id);
    Object.assign(tutorial, updateTutorialDto);
    return await this.tutorialsRepository.save(tutorial);
  }

  async remove(id: number): Promise<void> {
    const tutorial = await this.findOne(id);
    await this.tutorialsRepository.remove(tutorial);
  }

  // Get unique values for filters
  async getLevels(): Promise<string[]> {
    const result = await this.tutorialsRepository
      .createQueryBuilder('tutorial')
      .select('DISTINCT tutorial.level', 'level')
      .orderBy('tutorial.level', 'ASC')
      .getRawMany();
    
    return result.map(r => r.level);
  }

  async getSubjects(level?: string): Promise<string[]> {
    const query = this.tutorialsRepository
      .createQueryBuilder('tutorial')
      .select('DISTINCT tutorial.subject', 'subject')
      .orderBy('tutorial.subject', 'ASC');

    if (level) {
      query.where('tutorial.level = :level', { level });
    }

    const result = await query.getRawMany();
    return result.map(r => r.subject);
  }

  async getClasses(level?: string): Promise<string[]> {
    const query = this.tutorialsRepository
      .createQueryBuilder('tutorial')
      .select('DISTINCT tutorial.class', 'class')
      .orderBy('tutorial.class', 'ASC');

    if (level) {
      query.where('tutorial.level = :level', { level });
    }

    const result = await query.getRawMany();
    return result.map(r => r.class);
  }
}