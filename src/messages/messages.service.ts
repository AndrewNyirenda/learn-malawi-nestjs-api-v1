import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageStatus } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageStatusDto } from './dto/update-message-status.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {}

  async create(createMessageDto: CreateMessageDto): Promise<Message> {
    const message = this.messagesRepository.create(createMessageDto);
    return await this.messagesRepository.save(message);
  }

  async findAll(
    status?: MessageStatus,
    search?: string,
  ): Promise<Message[]> {
    const query = this.messagesRepository.createQueryBuilder('message');

    if (status) {
      query.andWhere('message.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        '(message.name ILIKE :search OR message.email ILIKE :search OR message.subject ILIKE :search OR message.message ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    query.orderBy('message.createdAt', 'DESC');

    return await query.getMany();
  }

  async findOne(id: number): Promise<Message> {
    const message = await this.messagesRepository.findOne({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    return message;
  }

  async updateStatus(id: number, updateStatusDto: UpdateMessageStatusDto): Promise<Message> {
    const message = await this.findOne(id);
    message.status = updateStatusDto.status;
    return await this.messagesRepository.save(message);
  }

  async remove(id: number): Promise<void> {
    const message = await this.findOne(id);
    await this.messagesRepository.remove(message);
  }

  async getStats(): Promise<{
  total: number;
  new: number;
  read: number;
}> {
  const total = await this.messagesRepository.count();
  const newCount = await this.messagesRepository.count({ where: { status: MessageStatus.NEW } });
  const readCount = await this.messagesRepository.count({ where: { status: MessageStatus.READ } });

  return {
    total,
    new: newCount,
    read: readCount,
  };
}
}