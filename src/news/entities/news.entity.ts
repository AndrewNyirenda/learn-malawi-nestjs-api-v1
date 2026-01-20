import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NewsCategory {
  POLITICS = 'Politics',
  BUSINESS = 'Business',
  TECHNOLOGY = 'Technology',
  SPORTS = 'Sports',
  ENTERTAINMENT = 'Entertainment',
  HEALTH = 'Health',
  EDUCATION = 'Education',
  SCIENCE = 'Science',
  WORLD = 'World',
  LOCAL = 'Local',
}

@Entity('news')
export class News {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imageUrl: string | null;

  @Column({ type: 'enum', enum: NewsCategory, default: NewsCategory.LOCAL })
  category: NewsCategory;

  @Column({ type: 'integer', default: 5 })
  readTime: number;

  @Column({ type: 'boolean', default: false })
  isPublished: boolean;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get authorName(): string {
    return this.author ? `${this.author.firstName} ${this.author.lastName}` : 'Unknown';
  }

  
}
