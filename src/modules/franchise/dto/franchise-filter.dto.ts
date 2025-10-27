// src/franchise/dto/franchise-filter.dto.ts

import { IsOptional, IsInt, IsBoolean, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 프랜차이즈 고급 필터 DTO
 * 
 * Query Parameter로 전달되는 필터 조건을 정의합니다.
 * 모든 필드는 선택적이며, 제공된 필드만 필터링에 사용됩니다.
 */
export class FranchiseFilterDto {
  // ============ 투자금 필터 ============
  
  /**
   * 최소 투자금 (원)
   * 계산 방식: 가맹비 + 교육비 + 보증금 + 인테리어 비용
   */
  @IsOptional()
  @Type(() => Number) // 문자열 "50000000"을 숫자로 자동 변환
  @IsInt({ message: '최소 투자금은 정수여야 합니다' })
  @Min(0, { message: '최소 투자금은 0 이상이어야 합니다' })
  minInvestment?: number;

  /**
   * 최대 투자금 (원)
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '최대 투자금은 정수여야 합니다' })
  @Min(0, { message: '최대 투자금은 0 이상이어야 합니다' })
  maxInvestment?: number;

  // ============ 매출 필터 ============
  
  /**
   * 최소 평균매출 (원)
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '최소 평균매출은 정수여야 합니다' })
  @Min(0, { message: '최소 평균매출은 0 이상이어야 합니다' })
  minRevenue?: number;

  /**
   * 최대 평균매출 (원)
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '최대 평균매출은 정수여야 합니다' })
  @Min(0, { message: '최대 평균매출은 0 이상이어야 합니다' })
  maxRevenue?: number;

  // ============ 가맹점 수 필터 ============
  
  /**
   * 최소 가맹점 수
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '최소 가맹점 수는 정수여야 합니다' })
  @Min(0, { message: '최소 가맹점 수는 0 이상이어야 합니다' })
  minStores?: number;

  /**
   * 최대 가맹점 수
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '최대 가맹점 수는 정수여야 합니다' })
  @Min(0, { message: '최대 가맹점 수는 0 이상이어야 합니다' })
  maxStores?: number;

  // ============ 해지율 필터 ============
  
  /**
   * 최대 해지율 (%)
   * 예: 5 입력 시 해지율 5% 이하만 조회
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '최대 해지율은 정수여야 합니다' })
  @Min(0, { message: '최대 해지율은 0 이상이어야 합니다' })
  @Max(100, { message: '최대 해지율은 100 이하여야 합니다' })
  maxTerminationRate?: number;

  // ============ 로열티 필터 ============
  
  /**
   * 로열티 유무
   * true: 로열티 있는 브랜드만
   * false: 로열티 없는 브랜드만
   * undefined: 전체
   */
  @IsOptional()
  @Type(() => Boolean) // "true"/"false" 문자열을 boolean으로 변환
  @IsBoolean({ message: '로열티 유무는 true/false 값이어야 합니다' })
  hasRoyalty?: boolean;

  // ============ 카테고리 필터 ============
  
  /**
   * 업종 카테고리
   * 예: "외식", "서비스", "도소매" 등
   */
  @IsOptional()
  @IsString({ message: '카테고리는 문자열이어야 합니다' })
  category?: string;

  // ============ 페이징 & 정렬 ============
  
  /**
   * 페이지 번호 (1부터 시작)
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '페이지는 정수여야 합니다' })
  @Min(1, { message: '페이지는 1 이상이어야 합니다' })
  page?: number = 1;

  /**
   * 페이지당 항목 수
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '페이지 크기는 정수여야 합니다' })
  @Min(1, { message: '페이지 크기는 1 이상이어야 합니다' })
  @Max(100, { message: '페이지 크기는 100 이하여야 합니다' })
  size?: number = 20;

  /**
   * 정렬 순서
   * - asc: 오래된순 (companyId 기준)
   * - desc: 최신순 (crawledAt 기준)
   */
  @IsOptional()
  @IsString({ message: '정렬 순서는 문자열이어야 합니다' })
  sortOrder?: 'asc' | 'desc' = 'desc';
}