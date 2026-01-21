// src/books/entities/book.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum EducationLevel {
  PRIMARY = 'primary',
  SECONDARY = 'secondary'
}

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  thumbnailUrl?: string;

 @Column({ type: 'varchar', length: 500, nullable: true })
fileUrl?: string;

@Column({ type: 'varchar', length: 100, nullable: true })
fileName?: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'varchar', length: 50 })
  class: string; // e.g., "Form 3", "Standard 7"

  @Column({ 
    type: 'enum', 
    enum: EducationLevel,
    default: EducationLevel.SECONDARY 
  })
  level: EducationLevel;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subject: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  author: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  publisher: string;

  @Column({ type: 'integer', nullable: true })
  year: number;

  @Column({ type: 'integer', default: 0 })
  downloadCount: number;

  @Column({ type: 'integer', default: 0 })
  viewCount: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @Column()
  uploadedById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}