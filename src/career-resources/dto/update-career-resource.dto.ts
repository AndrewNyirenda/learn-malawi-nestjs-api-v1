// src/career-resources/dto/update-career-resource.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateCareerResourceDto } from './create-career-resource.dto';

export class UpdateCareerResourceDto extends PartialType(CreateCareerResourceDto) {}