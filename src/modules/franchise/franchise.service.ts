// src/franchise/franchise.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FranchiseCategory } from './dto/franchise.dto';
import { PagingResponseDto, FranchiseResponseDto } from './dto/franchise.dto';

@Injectable()
export class FranchiseService {
  constructor(private prisma: PrismaService) {}

  async getFranchises(page: number = 1, size: number = 20) {
    const skip = (page - 1) * size;

    const [franchises, totalCount] = await Promise.all([
      this.prisma.franchise.findMany({
        skip,
        take: size,
        orderBy: { crawledAt: 'desc' }
      }),
      this.prisma.franchise.count()
    ]);

    return this.createPagingResponse(
      franchises.map(f => this.transformFranchiseData(f)), 
      totalCount, 
      page, 
      size
    );
  }

  async getFranchisesByCategory(
    category: FranchiseCategory,
    page: number = 1,
    size: number = 20
  ) {
    const skip = (page - 1) * size;
    
    // category는 basicInfo JSON에서 업종 정보를 추출해야 함
    const whereClause = category === FranchiseCategory.ALL 
      ? {}
      : {
          OR: [
            { companyName: { contains: this.getCategoryKeyword(category), mode: 'insensitive' as const } },
            { brandName: { contains: this.getCategoryKeyword(category), mode: 'insensitive' as const } }
          ]
        };

    const [franchises, totalCount] = await Promise.all([
      this.prisma.franchise.findMany({
        where: whereClause,
        skip,
        take: size,
        orderBy: { crawledAt: 'desc' }
      }),
      this.prisma.franchise.count({ where: whereClause })
    ]);

    return this.createPagingResponse(
      franchises.map(f => this.transformFranchiseData(f)),
      totalCount,
      page,
      size
    );
  }

  async searchFranchises(query: string, page: number = 1, size: number = 20) {
    const skip = (page - 1) * size;

    const whereClause = {
      OR: [
        { companyName: { contains: query, mode: 'insensitive' as const } },
        { brandName: { contains: query, mode: 'insensitive' as const } }
      ]
    };

    const [franchises, totalCount] = await Promise.all([
      this.prisma.franchise.findMany({
        where: whereClause,
        skip,
        take: size,
        orderBy: { crawledAt: 'desc' }
      }),
      this.prisma.franchise.count({ where: whereClause })
    ]);

    return this.createPagingResponse(
      franchises.map(f => this.transformFranchiseData(f)),
      totalCount,
      page,
      size
    );
  }

  async getFranchiseById(id: string) {
    const franchise = await this.prisma.franchise.findUnique({
      where: { companyId: id }
    });

    return franchise ? this.transformFranchiseData(franchise) : null;
  }

  private transformFranchiseData(franchise: any) {
    // 파이썬 데이터 구조를 안드로이드 앱에서 사용할 수 있는 형태로 변환
    return {
      id: franchise.companyId,
      name: franchise.companyName || franchise.brandName || "정보 없음",
      brandName: franchise.brandName || franchise.companyName || "정보 없음",
      category: this.extractCategory(franchise.basicInfo),
      ceo: this.extractCeoName(franchise.basicInfo),
      businessType: this.extractBusinessType(franchise.basicInfo),
      address: this.extractAddress(franchise.basicInfo),
      phone: this.extractPhone(franchise.basicInfo),
      status: this.determineStatus(franchise),
      imageUrl: null,
      
      // 상세 정보는 원본 JSON 구조 유지
      basicInfo: franchise.basicInfo,
      businessStatus: franchise.businessStatus,
      legalCompliance: franchise.legalCompliance,
      franchiseeCosts: franchise.franchiseeCosts,
      businessTerms: franchise.businessTerms,
      
      // 안드로이드 앱 호환을 위한 추가 정보
      financialInfo: this.extractFinancialInfo(franchise.businessStatus),
      storeInfo: this.extractStoreInfo(franchise.businessStatus),
      costInfo: this.extractCostInfo(franchise.franchiseeCosts),
      contractInfo: this.extractContractInfo(franchise.businessTerms),
      legalInfo: this.extractLegalInfo(franchise.legalCompliance),
      
      createdAt: franchise.crawledAt,
      updatedAt: franchise.updatedAt
    };
  }

  private extractCategory(basicInfo: any): string {
    try {
      const sections = basicInfo?.sections || [];
      for (const section of sections) {
        if (section?.data && Array.isArray(section.data)) {
          const businessTypeItem = section.data.find(item => 
            item?.title === '업종' || item?.title === '사업자유형'
          );
          if (businessTypeItem?.value) {
            return businessTypeItem.value;
          }
        }
      }
      return "기타";
    } catch {
      return "기타";
    }
  }

  private extractCeoName(basicInfo: any): string {
    try {
      const sections = basicInfo?.sections || [];
      for (const section of sections) {
        if (section?.data && Array.isArray(section.data)) {
          const ceoItem = section.data.find(item => 
            item?.title === '대표자' || item?.title === '대표자명'
          );
          if (ceoItem?.value) {
            return ceoItem.value;
          }
        }
      }
      return "정보 없음";
    } catch {
      return "정보 없음";
    }
  }

  private extractBusinessType(basicInfo: any): string {
    // basicInfo에서 사업자유형 추출
    return "법인"; // 기본값
  }

  private extractAddress(basicInfo: any): string {
    // basicInfo에서 주소 추출
    return "주소 정보 없음"; // 기본값
  }

  private extractPhone(basicInfo: any): string {
    // basicInfo에서 전화번호 추출
    return "전화번호 정보 없음"; // 기본값
  }

  private determineStatus(franchise: any): string {
    // 비즈니스 로직에 따라 상태 결정
    return "STABLE"; // 기본값
  }

  private extractFinancialInfo(businessStatus: any): any {
    // businessStatus에서 재무 정보 추출 및 변환
    return { financialData: [], advertisingCosts: [] };
  }

  private extractStoreInfo(businessStatus: any): any {
    // businessStatus에서 매장 정보 추출 및 변환
    return {
      totalStores: 0,
      directStores: 0,
      franchiseStores: 0,
      regionalHeadquarters: 0
    };
  }

  private extractCostInfo(franchiseeCosts: any): any {
    // franchiseeCosts에서 비용 정보 추출 및 변환
    return {
      joinFee: "0",
      educationFee: "0",
      securityDeposit: "0",
      totalInitialCost: "0"
    };
  }

  private extractContractInfo(businessTerms: any): any {
    // businessTerms에서 계약 정보 추출 및 변환
    return {
      initialPeriodYears: 0,
      extensionPeriodYears: 0
    };
  }

  private extractLegalInfo(legalCompliance: any): any {
    // legalCompliance에서 법적 정보 추출 및 변환
    return {
      ftcCorrections: 0,
      civilLawsuits: 0,
      criminalConvictions: 0
    };
  }

  private getCategoryKeyword(category: FranchiseCategory): string {
    const keywords = {
      [FranchiseCategory.KOREAN]: '한식',
      [FranchiseCategory.CHINESE]: '중식',
      [FranchiseCategory.JAPANESE]: '일식',
      [FranchiseCategory.CAFE_DESSERT]: '카페',
      [FranchiseCategory.CHICKEN_PIZZA]: '치킨'
    };
    return keywords[category] || '';
  }

  private createPagingResponse(franchises: any[], totalCount: number, page: number, size: number) {
    const totalPages = Math.ceil(totalCount / size);

    return {
      content: franchises,
      totalElements: totalCount,
      totalPages,
      currentPage: page,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };
  }
}