// src/franchise/franchise.controller.ts
import { Controller, Get, Query, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { FranchiseService } from './franchise.service';
import { 
  FranchiseQueryDto, 
  FranchiseCategoryQueryDto, 
  FranchiseSearchQueryDto 
} from './dto/franchise.dto';

@Controller('franchise')
export class FranchiseController {
  constructor(private franchiseService: FranchiseService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getFranchises(@Query() queryDto: FranchiseQueryDto) {
    const result = await this.franchiseService.getFranchises(
      queryDto.page,
      queryDto.size
    );

    return {
      success: true,
      message: '프랜차이즈 목록 조회 성공',
      data: result
    };
  }

  @Get('category/:category')
  @HttpCode(HttpStatus.OK)
  async getFranchisesByCategory(
    @Param('category') category: string,
    @Query() queryDto: FranchiseQueryDto
  ) {
    const result = await this.franchiseService.getFranchisesByCategory(
      category as any,
      queryDto.page,
      queryDto.size
    );

    return {
      success: true,
      message: `${category} 카테고리 프랜차이즈 조회 성공`,
      data: result
    };
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  async searchFranchises(@Query() queryDto: FranchiseSearchQueryDto) {
    const result = await this.franchiseService.searchFranchises(
      queryDto.query,
      queryDto.page,
      queryDto.size
    );

    return {
      success: true,
      message: '프랜차이즈 검색 성공',
      data: result
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getFranchiseById(@Param('id') id: string) {
    const franchise = await this.franchiseService.getFranchiseById(id);

    if (!franchise) {
      return {
        success: false,
        message: '프랜차이즈를 찾을 수 없습니다'
      };
    }

    return {
      success: true,
      message: '프랜차이즈 상세 조회 성공',
      data: { franchise }
    };
  }
}