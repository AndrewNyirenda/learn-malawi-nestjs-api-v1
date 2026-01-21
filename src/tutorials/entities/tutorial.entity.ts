import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum EducationLevel {
  PRIMARY = 'primary',
  SECONDARY = 'secondary'
}

@Entity('tutorials')
export class Tutorial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 100 })
  subject: string;

  @Column({
    type: 'enum',
    enum: EducationLevel,
    default: EducationLevel.PRIMARY
  })
  level: EducationLevel;

  @Column({ type: 'varchar', length: 50 })
  class: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 500 })
  videoUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}