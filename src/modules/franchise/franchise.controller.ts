// src/modules/franchise/franchise.controller.ts
import { Controller, Get, Query, Param, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { FranchiseService } from './franchise.service';
import { 
  FranchiseQueryDto, 
  FranchiseSearchQueryDto,
} from './dto/franchise.dto';
import { FranchiseFilterDto } from './dto/franchise-filter.dto';

@Controller('franchise')
export class FranchiseController {
  private readonly logger = new Logger(FranchiseController.name);

  constructor(private franchiseService: FranchiseService) {}

  // ============ 1. 카테고리 목록 조회 ============
  @Get('categories')
  @HttpCode(HttpStatus.OK)
  async getCategories() {
    this.logger.log('📂 [API] 카테고리 목록 조회');
    
    const result = await this.franchiseService.getCategories();
    
    return {
      success: true,
      message: '카테고리 목록 조회 성공',
      data: result.data
    };
  }

  // ============ 2. 브랜드 검색 ============
  @Get('search')
  @HttpCode(HttpStatus.OK)
  async searchFranchises(@Query() queryDto: FranchiseSearchQueryDto) {
    this.logger.log(`🔍 [API] 브랜드 검색: "${queryDto.query}"`);
    
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

  // ============ 3. 메타데이터 조회 ============
  @Get('meta')
  @HttpCode(HttpStatus.OK)
  async getMetadata() {
    this.logger.log('📊 [API] 메타데이터 조회');
    
    const result = await this.franchiseService.getMetadata();
    
    return {
      success: result.success,
      message: '메타데이터 조회 성공',
      data: result.data
    };
  }

  // ============ 4. 고급 필터 (✅ 수정됨) ============
  @Get('filter')
  @HttpCode(HttpStatus.OK)
  async filterFranchises(@Query() filterDto: FranchiseFilterDto) {
    this.logger.log('🔧 [API] 고급 필터 요청 받음');
    this.logger.debug('필터 조건:', JSON.stringify(filterDto, null, 2));

    try {
      const result = await this.franchiseService.filterFranchises(filterDto);

      this.logger.log(`✅ [API] 고급 필터 완료: ${result.totalElements}개 중 ${result.content.length}개 반환`);
      this.logger.debug('응답 샘플:', {
        totalElements: result.totalElements,
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        firstItem: result.content[0] || null
      });

      return {
        success: true,
        message: `필터 조회 성공: ${result.totalElements}개 브랜드 발견`,
        data: result
      };

    } catch (error) {
      this.logger.error('❌ [API] 고급 필터 실패:', error.message);
      this.logger.error(error.stack);

      return {
        success: false,
        message: '필터 조회 중 오류 발생',
        error: error.message
      };
    }
  }

  // ============ 5. 카테고리별 조회 ============
  @Get('category/:category')
  @HttpCode(HttpStatus.OK)
  async getFranchisesByCategory(
    @Param('category') category: string,
    @Query() queryDto: FranchiseQueryDto
  ) {
    this.logger.log(`📁 [API] 카테고리별 조회: ${category}`);
    
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

  // ============ 6. 전체 목록 조회 ============
  @Get('list')
  @HttpCode(HttpStatus.OK)
  async getFranchises(@Query() queryDto: FranchiseQueryDto) {
    this.logger.log(`📋 [API] 전체 목록 조회 (페이지 ${queryDto.page})`);
    
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

  // ============ 7. 상세 조회 (⚠️ 반드시 마지막!) ============
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getFranchiseById(@Param('id') id: string) {
    this.logger.log(`🔎 [API] 상세 조회: ID ${id}`);
    
    const idInt = parseInt(id, 10);
    
    if (isNaN(idInt)) {
      this.logger.warn(`❌ [API] 잘못된 ID: ${id}`);
      return {
        success: false,
        message: '잘못된 프랜차이즈 ID입니다'
      };
    }

    const franchise = await this.franchiseService.getFranchiseById(idInt);

    if (!franchise) {
      this.logger.warn(`❌ [API] 존재하지 않는 ID: ${idInt}`);
      return {
        success: false,
        message: '프랜차이즈를 찾을 수 없습니다'
      };
    }

    this.logger.log(`✅ [API] 상세 조회 성공: ${franchise.brandName}`);

    return {
      success: true,
      message: '프랜차이즈 상세 조회 성공',
      data: franchise
    };
  }
}