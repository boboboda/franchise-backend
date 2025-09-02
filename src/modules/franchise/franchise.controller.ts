// src/franchise/franchise.controller.ts
import { Controller, Get, Query, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { FranchiseService } from './franchise.service';
import { 
  FranchiseQueryDto, 
  FranchiseSearchQueryDto,
  FranchiseListResponse,
  FranchiseDetailResponse
} from './dto/franchise.dto';

@Controller('franchise')
export class FranchiseController {
  constructor(private franchiseService: FranchiseService) {}

  @Get('list')
  @HttpCode(HttpStatus.OK)
  async getFranchiseList(@Query() queryDto: FranchiseQueryDto): Promise<{
    success: boolean;
    message: string;
    data: FranchiseListResponse;
  }> {
    const result = await this.franchiseService.getFranchiseList(
      queryDto.page,
      queryDto.size
    );

    return {
      success: true,
      message: '프랜차이즈 목록 조회 성공',
      data: result
    };
  }

  @Get('list/search')
  @HttpCode(HttpStatus.OK)
  async searchFranchiseList(@Query() queryDto: FranchiseSearchQueryDto): Promise<{
    success: boolean;
    message: string;
    data: FranchiseListResponse;
  }> {
    const result = await this.franchiseService.searchFranchiseList(
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

  @Get('list/category/:category')
  @HttpCode(HttpStatus.OK)
  async getFranchiseListByCategory(
    @Param('category') category: string,
    @Query() queryDto: FranchiseQueryDto
  ): Promise<{
    success: boolean;
    message: string;
    data: FranchiseListResponse;
  }> {
    const result = await this.franchiseService.getFranchiseListByCategory(
      category,
      queryDto.page,
      queryDto.size
    );

    return {
      success: true,
      message: `${category} 카테고리 조회 성공`,
      data: result
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getFranchiseDetail(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
    data?: FranchiseDetailResponse;
  }> {
    const franchise = await this.franchiseService.getFranchiseDetail(id);

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