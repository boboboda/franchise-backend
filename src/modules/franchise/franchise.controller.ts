// src/franchise/franchise.controller.ts
import { Controller, Get, Query, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { FranchiseService } from './franchise.service';
import { 
 FranchiseQueryDto, 
 FranchiseSearchQueryDto
} from './dto/franchise.dto';
import { FranchiseFilterDto } from './dto/franchise-filter.dto';

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

 @Get('meta')
 @HttpCode(HttpStatus.OK)
 async getMetadata() {
   const result = await this.franchiseService.getMetadata();
   
   return {
     success: result.success,
     message: '메타데이터 조회 성공',
     data: result.data
   };
 }

 @Get('category/:category')
 @HttpCode(HttpStatus.OK)
 async getFranchisesByCategory(
   @Param('category') category: string,
   @Query() queryDto: FranchiseQueryDto
 ) {
   const result = await this.franchiseService.getFranchisesByCategory(
     category,
     queryDto.page,
     queryDto.size,
     queryDto.sortOrder
   );

   return {
     success: true,
     message: `${category} 카테고리 조회 성공 (${queryDto.sortOrder === 'desc' ? '최신순' : '오래된순'})`,
     data: result
   };
 }

 @Get(':id')
 @HttpCode(HttpStatus.OK)
 async getFranchiseById(@Param('id') id: string) {
   const idInt = parseInt(id, 10);
   
   if (isNaN(idInt)) {
     return {
       success: false,
       message: '잘못된 프랜차이즈 ID입니다'
     };
   }

   const franchise = await this.franchiseService.getFranchiseById(idInt);

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

 @Get()
 @HttpCode(HttpStatus.OK)
 async getFranchises(@Query() queryDto: FranchiseQueryDto) {
   const result = await this.franchiseService.getFranchises(
     queryDto.page,
     queryDto.size,
     queryDto.sortOrder
   );

   return {
     success: true,
     message: `프랜차이즈 목록 조회 성공 (${queryDto.sortOrder === 'desc' ? '최신순' : '오래된순'})`,
     data: result
   };
 }


 /* 고급 필터로 프랜차이즈 조회
   * 
   * @route GET /franchise/filter
   * @param filterDto - Query Parameter로 전달된 필터 조건
   * @returns 필터링된 프랜차이즈 목록
   * 
   * @example
   * GET /franchise/filter?minInvestment=50000000&maxInvestment=100000000&maxTerminationRate=5&page=1&size=20
   */
  @Get('filter')
  @HttpCode(HttpStatus.OK)
  async filterFranchises(@Query() filterDto: FranchiseFilterDto) {
    console.log('📥 [API] 고급 필터 요청:', filterDto);

    const result = await this.franchiseService.filterFranchises(filterDto);

    console.log('📤 [API] 고급 필터 응답:', {
      totalElements: result.totalElements,
      currentPage: result.currentPage,
      totalPages: result.totalPages
    });

    return {
      success: true,
      message: '필터 조회 성공',
      data: result
    };
  }
}