import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { EducationLevel } from '../../books/entities/book.entity';

@Entity('past_papers')
export class PastPaper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  thumbnailUrl?: string; // Make optional with ?

  @Column({ type: 'varchar', length: 500, nullable: true }) // Add nullable: true
  fileUrl?: string; // Make optional with ?

  @Column({ type: 'varchar', length: 100, nullable: true }) // Add nullable: true
  fileName?: string; // Make optional with ?

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'varchar', length: 50 })
  class: string; // e.g., "Form 4", "Standard 8"

  @Column({ 
    type: 'enum', 
    enum: EducationLevel,
    default: EducationLevel.SECONDARY 
  })
  level: EducationLevel;

  @Column({ type: 'integer' })
  year: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subject: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  examinationBody: string; // e.g., "MANEB", "CEED"

  @Column({ type: 'varchar', length: 50, nullable: true })
  paperNumber: string; // e.g., "I", "II", "III"

  @Column({ type: 'varchar', length: 50, nullable: true })
  paperType: string; // e.g., "Question", "Answer", "Both"

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