// src/franchise/franchise.module.ts
import { Module } from '@nestjs/common';
import { FranchiseController } from './franchise.controller';
import { FranchiseService } from './franchise.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [FranchiseController],
  providers: [FranchiseService, PrismaService],
})
export class FranchiseModule {}