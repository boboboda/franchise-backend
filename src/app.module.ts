import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { FranchiseModule } from './modules/franchise/franchise.module';
import { CrawlerSchedulerModule } from './modules/crawler-scheduler/crawler-scheduler.module';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';


@Module({
  controllers: [AppController],
  providers: [AppService, PrismaService],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    FranchiseModule,
    CrawlerSchedulerModule,
    AuthModule,
  ],
})
export class AppModule {}
