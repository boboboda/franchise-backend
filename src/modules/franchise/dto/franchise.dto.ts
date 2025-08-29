
// src/franchise/dto/franchise-query.dto.ts
import { IsOptional, IsInt, Min, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum FranchiseCategory {
  ALL = 'ALL',
  KOREAN = '한식',
  CHINESE = '중식',
  JAPANESE = '일식',
  WESTERN = '양식',
  OTHER_FOOD = '기타 외식',
  CAFE_DESSERT = '카페·디저트',
  CHICKEN_PIZZA = '치킨·피자',
  CONVENIENCE = '편의점',
  BEAUTY = '미용·뷰티',
  EDUCATION = '교육·학원',
  LIFE_SERVICE = '생활서비스',
  CLOTHING = '의류·잡화',
  RETAIL = '소매업',
  SERVICE = '서비스업'
}

export class FranchiseQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  size?: number = 20;
}

export class FranchiseCategoryQueryDto extends FranchiseQueryDto {
  @IsEnum(FranchiseCategory)
  category: FranchiseCategory;
}

export class FranchiseSearchQueryDto extends FranchiseQueryDto {
  @IsString()
  query: string;
}

// src/franchise/dto/franchise-response.dto.ts
export class PagingResponseDto<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export class FranchiseResponseDto {
  id: string;
  name: string;
  brandName: string;
  category: string;
  ceo: string;
  businessType: string;
  address: string;
  phone: string;
  status: string;
  imageUrl?: string;
  basicInfo: any;
  financialInfo: any;
  storeInfo: any;
  costInfo: any;
  contractInfo: any;
  legalInfo: any;
  createdAt: Date;
  updatedAt: Date;
}