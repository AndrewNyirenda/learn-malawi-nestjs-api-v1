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
  BadRequestException,
} from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuizResponseDto } from './dto/quiz-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../users/entities/user.entity';
import { plainToInstance } from 'class-transformer';

@Controller('quizzes')
@UseInterceptors(ClassSerializerInterceptor)
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  private toResponseDto(quiz: any): QuizResponseDto {
    return plainToInstance(QuizResponseDto, quiz, {
      excludeExtraneousValues: true,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async create(@Body() createQuizDto: CreateQuizDto): Promise<QuizResponseDto> {
    const quiz = await this.quizzesService.create(createQuizDto);
    return this.toResponseDto(quiz);
  }

  @Get()
  @Public()
  async findAll(
    @Query('level') level?: string,
    @Query('subject') subject?: string,
    @Query('difficulty') difficulty?: string,
    @Query('class') classFilter?: string,
  ): Promise<QuizResponseDto[]> {
    // Validate level parameter if provided
    if (level && level !== 'all' && level !== 'primary' && level !== 'secondary') {
      throw new BadRequestException('Level must be either "primary", "secondary", or "all"');
    }

    // Validate difficulty parameter if provided
    if (difficulty && difficulty !== 'all' && 
        difficulty !== 'easy' && difficulty !== 'medium' && difficulty !== 'hard') {
      throw new BadRequestException('Difficulty must be either "easy", "medium", "hard", or "all"');
    }

    const quizzes = await this.quizzesService.findAll(level, subject, difficulty, classFilter);
    return quizzes.map(quiz => this.toResponseDto(quiz));
  }

  @Get('levels')
  @Public()
  async getLevels(): Promise<{ levels: string[] }> {
    const levels = await this.quizzesService.getLevels();
    return { levels };
  }

  @Get('subjects')
  @Public()
  async getSubjects(@Query('level') level?: string): Promise<{ subjects: string[] }> {
    // Validate level parameter if provided
    if (level && level !== 'all' && level !== 'primary' && level !== 'secondary') {
      throw new BadRequestException('Level must be either "primary", "secondary", or "all"');
    }

    const subjects = await this.quizzesService.getSubjects(level);
    return { subjects };
  }

  @Get('classes')
  @Public()
  async getClasses(@Query('level') level?: string): Promise<{ classes: string[] }> {
    // Validate level parameter if provided
    if (level && level !== 'all' && level !== 'primary' && level !== 'secondary') {
      throw new BadRequestException('Level must be either "primary", "secondary", or "all"');
    }

    const classes = await this.quizzesService.getClasses(level);
    return { classes };
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string): Promise<QuizResponseDto> {
    // Validate that id is a number
    if (isNaN(+id)) {
      throw new BadRequestException('Quiz ID must be a number');
    }

    const quiz = await this.quizzesService.findOne(+id);
    return this.toResponseDto(quiz);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async update(
    @Param('id') id: string,
    @Body() updateQuizDto: UpdateQuizDto,
  ): Promise<QuizResponseDto> {
    // Validate that id is a number
    if (isNaN(+id)) {
      throw new BadRequestException('Quiz ID must be a number');
    }

    const quiz = await this.quizzesService.update(+id, updateQuizDto);
    return this.toResponseDto(quiz);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    // Validate that id is a number
    if (isNaN(+id)) {
      throw new BadRequestException('Quiz ID must be a number');
    }

    await this.quizzesService.remove(+id);
  }

  // Question-specific endpoints
  @Post(':id/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async addQuestion(
    @Param('id') id: string,
    @Body() createQuestionDto: CreateQuestionDto,
  ): Promise<any> {
    // Validate that id is a number
    if (isNaN(+id)) {
      throw new BadRequestException('Quiz ID must be a number');
    }

    const question = await this.quizzesService.addQuestion(+id, createQuestionDto);
    return question;
  }

  @Patch('questions/:questionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async updateQuestion(
    @Param('questionId') questionId: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ): Promise<any> {
    // Validate that questionId is a number
    if (isNaN(+questionId)) {
      throw new BadRequestException('Question ID must be a number');
    }

    const question = await this.quizzesService.updateQuestion(+questionId, updateQuestionDto);
    return question;
  }

  @Delete('questions/:questionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeQuestion(@Param('questionId') questionId: string): Promise<void> {
    // Validate that questionId is a number
    if (isNaN(+questionId)) {
      throw new BadRequestException('Question ID must be a number');
    }

    await this.quizzesService.removeQuestion(+questionId);
  }
}