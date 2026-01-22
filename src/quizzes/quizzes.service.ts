import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from './entities/quiz.entity';
import { Question } from './entities/question.entity';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Quiz)
    private quizzesRepository: Repository<Quiz>,
    @InjectRepository(Question)
    private questionsRepository: Repository<Question>,
  ) {}

  async create(createQuizDto: CreateQuizDto): Promise<Quiz> {
    const quiz = this.quizzesRepository.create({
      ...createQuizDto,
      questions: createQuizDto.questions.map(q => this.questionsRepository.create(q))
    });
    
    return await this.quizzesRepository.save(quiz);
  }

  async findAll(
    level?: string,
    subject?: string,
    difficulty?: string,
    classFilter?: string,
  ): Promise<Quiz[]> {
    const query = this.quizzesRepository.createQueryBuilder('quiz')
      .leftJoinAndSelect('quiz.questions', 'questions');

    // Only filter by level if it's a valid enum value
    if (level && level !== 'all' && (level === 'primary' || level === 'secondary')) {
      query.andWhere('quiz.level = :level', { level });
    }

    if (subject && subject !== 'all') {
      query.andWhere('quiz.subject = :subject', { subject });
    }

    if (difficulty && difficulty !== 'all') {
      query.andWhere('quiz.difficulty = :difficulty', { difficulty });
    }

    if (classFilter && classFilter !== 'all') {
      query.andWhere('quiz.class = :classFilter', { classFilter });
    }

    query.orderBy('quiz.id', 'ASC');

    return await query.getMany();
  }

  async findOne(id: number): Promise<Quiz> {
    const quiz = await this.quizzesRepository.findOne({
      where: { id },
      relations: ['questions'],
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    return quiz;
  }

  async update(id: number, updateQuizDto: UpdateQuizDto): Promise<Quiz> {
    const quiz = await this.findOne(id);
    
    // Remove existing questions if new ones are provided
    if (updateQuizDto.questions) {
      await this.questionsRepository.delete({ quizId: id });
      quiz.questions = updateQuizDto.questions.map(q => this.questionsRepository.create(q));
    }
    
    Object.assign(quiz, updateQuizDto);
    return await this.quizzesRepository.save(quiz);
  }

  async remove(id: number): Promise<void> {
    const quiz = await this.findOne(id);
    await this.quizzesRepository.remove(quiz);
  }

  // Question-specific methods
  async addQuestion(quizId: number, createQuestionDto: CreateQuestionDto): Promise<Question> {
    const quiz = await this.findOne(quizId);
    const question = this.questionsRepository.create({
      ...createQuestionDto,
      quiz,
    });
    
    return await this.questionsRepository.save(question);
  }

  async updateQuestion(questionId: number, updateQuestionDto: UpdateQuestionDto): Promise<Question> {
    const question = await this.questionsRepository.findOne({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    Object.assign(question, updateQuestionDto);
    return await this.questionsRepository.save(question);
  }

  async removeQuestion(questionId: number): Promise<void> {
    const question = await this.questionsRepository.findOne({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    await this.questionsRepository.remove(question);
  }

  // Get unique values for filters
  async getLevels(): Promise<string[]> {
    const result = await this.quizzesRepository
      .createQueryBuilder('quiz')
      .select('DISTINCT quiz.level', 'level')
      .orderBy('quiz.level', 'ASC')
      .getRawMany();
    
    return result.map(r => r.level);
  }

  async getSubjects(level?: string): Promise<string[]> {
    const query = this.quizzesRepository
      .createQueryBuilder('quiz')
      .select('DISTINCT quiz.subject', 'subject')
      .orderBy('quiz.subject', 'ASC');

    // Only filter if level is a valid enum value (primary or secondary)
    if (level && level !== 'all' && (level === 'primary' || level === 'secondary')) {
      query.where('quiz.level = :level', { level });
    }
    // If level is 'all' or any other value, don't apply level filter

    const result = await query.getRawMany();
    return result.map(r => r.subject);
  }

  async getClasses(level?: string): Promise<string[]> {
    const query = this.quizzesRepository
      .createQueryBuilder('quiz')
      .select('DISTINCT quiz.class', 'class')
      .orderBy('quiz.class', 'ASC');

    // Only filter if level is a valid enum value (primary or secondary)
    if (level && level !== 'all' && (level === 'primary' || level === 'secondary')) {
      query.where('quiz.level = :level', { level });
    }
    // If level is 'all' or any other value, don't apply level filter

    const result = await query.getRawMany();
    return result.map(r => r.class);
  }
}