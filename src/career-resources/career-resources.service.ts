// src/career-resources/career-resources.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CareerResource } from './entities/career-resource.entity';
import { CreateCareerResourceDto } from './dto/create-career-resource.dto';
import { UpdateCareerResourceDto } from './dto/update-career-resource.dto';

@Injectable()
export class CareerResourcesService {
  constructor(
    @InjectRepository(CareerResource)
    private careerResourcesRepository: Repository<CareerResource>,
  ) {}

  async create(createCareerResourceDto: CreateCareerResourceDto): Promise<CareerResource> {
    const careerResource = this.careerResourcesRepository.create(createCareerResourceDto);
    return await this.careerResourcesRepository.save(careerResource);
  }

  async findAll(): Promise<CareerResource[]> {
    return await this.careerResourcesRepository.find({
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<CareerResource> {
    const careerResource = await this.careerResourcesRepository.findOne({
      where: { id },
    });

    if (!careerResource) {
      throw new NotFoundException(`Career resource with ID ${id} not found`);
    }

    return careerResource;
  }

  async update(id: number, updateCareerResourceDto: UpdateCareerResourceDto): Promise<CareerResource> {
    const careerResource = await this.findOne(id);
    Object.assign(careerResource, updateCareerResourceDto);
    return await this.careerResourcesRepository.save(careerResource);
  }

  async remove(id: number): Promise<void> {
    const careerResource = await this.findOne(id);
    await this.careerResourcesRepository.remove(careerResource);
  }
}