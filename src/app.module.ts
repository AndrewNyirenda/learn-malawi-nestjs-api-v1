import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { NewsModule } from './news/news.module';
import { JwtAuthGuardWithPublic } from './auth/guards/public.guard';
import { User } from './users/entities/user.entity';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { News } from './news/entities/news.entity';
import { Book } from './books/entities/book.entity';
import { PastPaper } from './past-papers/entities/past-paper.entity'; 
import {CareerResource} from './career-resources/entities/career-resource.entity';
import * as Joi from 'joi';
import {BooksModule} from './books/books.module';
import {PastPapersModule} from './past-papers/past-papers.module';
import {CareerResourcesModule} from "./career-resources/career-resources.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        CLOUDINARY_CLOUD_NAME: Joi.string().required(),
        CLOUDINARY_API_KEY: Joi.string().required(),
        CLOUDINARY_API_SECRET: Joi.string().required(),
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        ssl: configService.get<string>('NODE_ENV') === 'production',
        entities: [User, RefreshToken, News, Book, PastPaper, CareerResource], 
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    NewsModule,
    PastPapersModule,
    BooksModule,
    CareerResourcesModule
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuardWithPublic,
    },
  ],
})
export class AppModule {}