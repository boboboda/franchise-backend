// src/franchise/franchise.controller.ts
import { Controller, Get, Query, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { FranchiseService } from './franchise.service';
import { 
  FranchiseQueryDto, 
  FranchiseSearchQueryDto
} from './dto/franchise.dto';

@Controller('franchise')
export class FranchiseController {
  constructor(private franchiseService: FranchiseService) {}


  @Get('categories')
@HttpCode(HttpStatus.OK)
async getCategories() {
  const result = await this.franchiseService.getCategories();
  
  return {
    success: true,
    message: '카테고리 목록 조회 성공',
    data: result.data
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

@Get('category/:category')
@HttpCode(HttpStatus.OK)
async getFranchisesByCategory(
  @Param('category') category: string,
  @Query() queryDto: FranchiseQueryDto  // sortOrder 파라미터 포함
) {
  const result = await this.franchiseService.getFranchisesByCategory(
    category,
    queryDto.page,
    queryDto.size,
    queryDto.sortOrder  // 정렬 파라미터 추가
  );

  return {
    success: true,
    message: `${category} 카테고리 조회 성공 (${queryDto.sortOrder === 'desc' ? '최신순' : '오래된순'})`,
    data: result
  };
}

@Get()
@HttpCode(HttpStatus.OK)
async getFranchises(@Query() queryDto: FranchiseQueryDto) {
  const result = await this.franchiseService.getFranchises(
    queryDto.page,
    queryDto.size,
    queryDto.sortOrder  // 추가
  );

  return {
    success: true,
    message: `프랜차이즈 목록 조회 성공 (${queryDto.sortOrder === 'desc' ? '최신순' : '오래된순'})`,
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
      data: franchise
    };
  }
}