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
  HttpCode,
  HttpStatus,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { TutorialsService } from './tutorials.service';
import { CreateTutorialDto } from './dto/create-tutorial.dto';
import { UpdateTutorialDto } from './dto/update-tutorial.dto';
import { TutorialResponseDto } from './dto/tutorial-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../users/entities/user.entity';
import { plainToInstance } from 'class-transformer';

@Controller('tutorials')
@UseInterceptors(ClassSerializerInterceptor)
export class TutorialsController {
  constructor(private readonly tutorialsService: TutorialsService) {}

  private toResponseDto(tutorial: any): TutorialResponseDto {
    return plainToInstance(TutorialResponseDto, tutorial, {
      excludeExtraneousValues: true,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async create(@Body() createTutorialDto: CreateTutorialDto): Promise<TutorialResponseDto> {
    const tutorial = await this.tutorialsService.create(createTutorialDto);
    return this.toResponseDto(tutorial);
  }

  @Get()
  @Public()
  async findAll(
    @Query('level') level?: string,
    @Query('subject') subject?: string,
    @Query('class') classFilter?: string,
  ): Promise<TutorialResponseDto[]> {
    const tutorials = await this.tutorialsService.findAll(level, subject, classFilter);
    return tutorials.map(tutorial => this.toResponseDto(tutorial));
  }

  @Get('levels')
  @Public()
  async getLevels(): Promise<{ levels: string[] }> {
    const levels = await this.tutorialsService.getLevels();
    return { levels };
  }

  @Get('subjects')
  @Public()
  async getSubjects(@Query('level') level?: string): Promise<{ subjects: string[] }> {
    const subjects = await this.tutorialsService.getSubjects(level);
    return { subjects };
  }

  @Get('classes')
  @Public()
  async getClasses(@Query('level') level?: string): Promise<{ classes: string[] }> {
    const classes = await this.tutorialsService.getClasses(level);
    return { classes };
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string): Promise<TutorialResponseDto> {
    const tutorial = await this.tutorialsService.findOne(+id);
    return this.toResponseDto(tutorial);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async update(
    @Param('id') id: string,
    @Body() updateTutorialDto: UpdateTutorialDto,
  ): Promise<TutorialResponseDto> {
    const tutorial = await this.tutorialsService.update(+id, updateTutorialDto);
    return this.toResponseDto(tutorial);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.tutorialsService.remove(+id);
  }
}