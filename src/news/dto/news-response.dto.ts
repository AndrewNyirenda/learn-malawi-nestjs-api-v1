import { NewsCategory } from '../entities/news.entity';
export class NewsResponseDto {
  id: string;
  title: string;
  description: string;
  content: string;
  imageUrl: string | null;
  category: NewsCategory;
  readTime: number;
  isPublished: boolean;
  publishedAt: Date | null;
  author: { id: string; firstName: string; lastName: string; email: string };
  createdAt: Date;
  updatedAt: Date;
}
