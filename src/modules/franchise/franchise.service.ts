// src/franchise/franchise.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FranchiseCategory } from './dto/franchise.dto';

@Injectable()
export class FranchiseService {
  constructor(private prisma: PrismaService) {}


  // src/franchise/franchise.service.ts
async searchFranchiseList(query: string, page: number = 1, size: number = 20) {
  const skip = (page - 1) * size;

  if (!query || query.trim() === '') {
    return this.getFranchiseList(page, size);
  }

  const trimmedQuery = query.trim();

  const whereClause = {
    OR: [
      { 
        companyName: { 
          contains: trimmedQuery, 
          mode: 'insensitive' as const 
        } 
      },
      { 
        brandName: { 
          contains: trimmedQuery, 
          mode: 'insensitive' as const 
        } 
      }
    ]
  };

  const [franchises, totalCount] = await Promise.all([
    this.prisma.franchise.findMany({
      where: whereClause,
      skip,
      take: size,
      orderBy: { crawledAt: 'desc' },
      select: {
        companyId: true,
        companyName: true,
        brandName: true,
        basicInfo: true,
        businessStatus: true,
        crawledAt: true,
        updatedAt: true
      }
    }),
    this.prisma.franchise.count({ where: whereClause })
  ]);

  return this.createPagingResponse(
    franchises.map(f => this.transformToListItem(f)),
    totalCount,
    page,
    size
  );
}

async getFranchiseListByCategory(category: string, page: number = 1, size: number = 20) {
  const skip = (page - 1) * size;
  
  let whereClause = {};
  
  if (category !== 'ALL') {
    whereClause = {
      basicInfo: {
        contains: `"업종","value":"${category}"`
      }
    };
  }

  const [franchises, totalCount] = await Promise.all([
    this.prisma.franchise.findMany({
      where: whereClause,
      skip,
      take: size,
      orderBy: { crawledAt: 'desc' },
      select: {
        companyId: true,
        companyName: true,
        brandName: true,
        basicInfo: true,
        businessStatus: true,
        crawledAt: true,
        updatedAt: true
      }
    }),
    this.prisma.franchise.count({ where: whereClause })
  ]);

  return this.createPagingResponse(
    franchises.map(f => this.transformToListItem(f)),
    totalCount,
    page,
    size
  );
}

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

  

    async getFranchiseList(page: number = 1, size: number = 20) {
    const skip = (page - 1) * size;

    const [franchises, totalCount] = await Promise.all([
      this.prisma.franchise.findMany({
        skip,
        take: size,
        orderBy: { crawledAt: 'desc' },
        select: {
          companyId: true,
          companyName: true,
          brandName: true,
          basicInfo: true,
          businessStatus: true,
          crawledAt: true,
          updatedAt: true
        }
      }),
      this.prisma.franchise.count()
    ]);

    return this.createPagingResponse(
      franchises.map(f => this.transformToListItem(f)), 
      totalCount, 
      page, 
      size
    );
  }

  // 상세용 - 전체 데이터
  async getFranchiseDetail(id: string) {
    const franchise = await this.prisma.franchise.findUnique({
      where: { companyId: id }
      // 모든 필드 선택 (select 없음)
    });

    return franchise ? this.transformToDetailData(franchise) : null;
  }

  // 목록용 변환 (가벼운 데이터)
  private transformToListItem(franchise: any) {
    const basicInfo = this.parseJsonField(franchise.basicInfo);
    const businessStatus = this.parseJsonField(franchise.businessStatus);
    const storeInfo = this.extractStoreInfo(businessStatus);

    return {
      id: franchise.companyId,
      name: franchise.companyName || franchise.brandName || "정보 없음",
      brandName: franchise.brandName || franchise.companyName || "정보 없음",
      category: this.extractCategory(basicInfo),
      ceo: this.extractCeoName(basicInfo),
      businessType: this.extractBusinessType(basicInfo),
      address: this.extractAddress(basicInfo),
      phone: this.extractPhone(basicInfo),
      status: this.determineStatus(franchise),
      imageUrl: null,
      // 목록에서 필요한 매장 정보만
      totalStores: storeInfo.totalStores,
      directStores: storeInfo.directStores,
      franchiseStores: storeInfo.franchiseStores,
      createdAt: franchise.crawledAt,
      updatedAt: franchise.updatedAt
    };
  }

  // 상세용 변환 (전체 데이터)
  private transformToDetailData(franchise: any) {
    const basicInfo = this.parseJsonField(franchise.basicInfo);
    const businessStatus = this.parseJsonField(franchise.businessStatus);
    const franchiseeCosts = this.parseJsonField(franchise.franchiseeCosts);
    const businessTerms = this.parseJsonField(franchise.businessTerms);
    const legalCompliance = this.parseJsonField(franchise.legalCompliance);

    return {
      id: franchise.companyId,
      name: franchise.companyName || franchise.brandName || "정보 없음",
      brandName: franchise.brandName || franchise.companyName || "정보 없음",
      category: this.extractCategory(basicInfo),
      ceo: this.extractCeoName(basicInfo),
      businessType: this.extractBusinessType(basicInfo),
      address: this.extractAddress(basicInfo),
      phone: this.extractPhone(basicInfo),
      status: this.determineStatus(franchise),
      imageUrl: null,
      
      // 상세 정보 전체
      basicInfo: basicInfo,
      businessStatus: businessStatus,
      legalCompliance: legalCompliance,
      franchiseeCosts: franchiseeCosts,
      businessTerms: businessTerms,
      
      // 안드로이드 앱 호환용
      financialInfo: this.extractFinancialInfo(basicInfo),
      storeInfo: this.extractStoreInfo(businessStatus),
      costInfo: this.extractCostInfo(franchiseeCosts),
      contractInfo: this.extractContractInfo(businessTerms),
      legalInfo: this.extractLegalInfo(legalCompliance),
      
      createdAt: franchise.crawledAt,
      updatedAt: franchise.updatedAt
    };
  }

  async getFranchisesByCategory(
    category: FranchiseCategory,
    page: number = 1,
    size: number = 20
  ) {
    const skip = (page - 1) * size;
    
    let whereClause = {};
    
    if (category !== FranchiseCategory.ALL) {
      // JSON 필드에서 업종 검색
      whereClause = {
        basicInfo: {
          contains: `"업종","value":"${category}"`
        }
      };
    }

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

  // query가 없거나 빈 문자열인 경우 전체 목록 반환
  if (!query || query.trim() === '') {
    return this.getFranchises(page, size);
  }

  const trimmedQuery = query.trim();

  const whereClause = {
    OR: [
      { 
        companyName: { 
          contains: trimmedQuery, 
          mode: 'insensitive' as const 
        } 
      },
      { 
        brandName: { 
          contains: trimmedQuery, 
          mode: 'insensitive' as const 
        } 
      },
      { 
        basicInfo: { 
          string_contains: trimmedQuery 
        } 
      }
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
    const basicInfo = this.parseJsonField(franchise.basicInfo);
    const businessStatus = this.parseJsonField(franchise.businessStatus);
    const franchiseeCosts = this.parseJsonField(franchise.franchiseeCosts);
    const businessTerms = this.parseJsonField(franchise.businessTerms);
    const legalCompliance = this.parseJsonField(franchise.legalCompliance);

    return {
      id: franchise.companyId,
      name: franchise.companyName || franchise.brandName || "정보 없음",
      brandName: franchise.brandName || franchise.companyName || "정보 없음",
      category: this.extractCategory(basicInfo),
      ceo: this.extractCeoName(basicInfo),
      businessType: this.extractBusinessType(basicInfo),
      address: this.extractAddress(basicInfo),
      phone: this.extractPhone(basicInfo),
      status: this.determineStatus(franchise),
      imageUrl: null,
      
      // 상세 정보는 원본 JSON 구조 유지
      basicInfo: basicInfo,
      businessStatus: businessStatus,
      legalCompliance: legalCompliance,
      franchiseeCosts: franchiseeCosts,
      businessTerms: businessTerms,
      
      // 안드로이드 앱 호환을 위한 추가 정보
      financialInfo: this.extractFinancialInfo(basicInfo),
      storeInfo: this.extractStoreInfo(businessStatus),
      costInfo: this.extractCostInfo(franchiseeCosts),
      contractInfo: this.extractContractInfo(businessTerms),
      legalInfo: this.extractLegalInfo(legalCompliance),
      
      createdAt: franchise.crawledAt,
      updatedAt: franchise.updatedAt
    };
  }

  private parseJsonField(jsonString: string): any {
    try {
      return JSON.parse(jsonString);
    } catch {
      return {};
    }
  }

  private extractCategory(basicInfo: any): string {
    try {
      const sections = basicInfo?.sections || [];
      for (const section of sections) {
        if (section?.data && Array.isArray(section.data)) {
          const categoryItem = section.data.find(item => 
            item?.title === '업종'
          );
          if (categoryItem?.value) {
            return categoryItem.value;
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
            item?.title === '대표자'
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
    try {
      const sections = basicInfo?.sections || [];
      for (const section of sections) {
        if (section?.data && Array.isArray(section.data)) {
          const typeItem = section.data.find(item => 
            item?.title === '사업자유형'
          );
          if (typeItem?.value) {
            return typeItem.value;
          }
        }
      }
      return "법인";
    } catch {
      return "법인";
    }
  }

  private extractAddress(basicInfo: any): string {
    try {
      const sections = basicInfo?.sections || [];
      for (const section of sections) {
        if (section?.data && Array.isArray(section.data)) {
          const addressItem = section.data.find(item => 
            item?.title === '주소'
          );
          if (addressItem?.value) {
            return addressItem.value;
          }
        }
      }
      return "주소 정보 없음";
    } catch {
      return "주소 정보 없음";
    }
  }

  private extractPhone(basicInfo: any): string {
    try {
      const sections = basicInfo?.sections || [];
      for (const section of sections) {
        if (section?.data && Array.isArray(section.data)) {
          const phoneItem = section.data.find(item => 
            item?.title === '대표번호'
          );
          if (phoneItem?.value) {
            return phoneItem.value;
          }
        }
      }
      return "전화번호 정보 없음";
    } catch {
      return "전화번호 정보 없음";
    }
  }

  private determineStatus(franchise: any): string {
    // 비즈니스 로직에 따라 상태 결정 (예: 최근 등록일 기준)
    const crawledAt = new Date(franchise.crawledAt);
    const daysDiff = Math.floor((Date.now() - crawledAt.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 30) return "NEW";
    return "STABLE";
  }

  private extractFinancialInfo(basicInfo: any): any {
    try {
      const sections = basicInfo?.sections || [];
      const financialSection = sections.find(section => 
        section?.title === '재무 상황'
      );
      
      if (financialSection?.data) {
        return {
          financialData: financialSection.data,
          advertisingCosts: []
        };
      }
    } catch {}
    
    return { financialData: [], advertisingCosts: [] };
  }

  private extractStoreInfo(businessStatus: any): any {
  try {
    const sections = businessStatus?.sections || [];
    const storeSection = sections.find(section => 
      section?.title === '가맹점 및 직영점 현황'
    );
    
    if (storeSection?.data) {
      const allRegionData = storeSection.data.find(region => region.region === '전체');
      if (allRegionData?.year_data) {
        const latestYear = Object.keys(allRegionData.year_data).sort().pop();
        
        // latestYear가 존재하는지 확인
        if (latestYear && allRegionData.year_data[latestYear]) {
          const latestData = allRegionData.year_data[latestYear];
          
          return {
            totalStores: parseInt(latestData.total) || 0,
            directStores: parseInt(latestData.direct_count) || 0,
            franchiseStores: parseInt(latestData.franchise_count) || 0,
            regionalHeadquarters: 0
          };
        }
      }
    }
  } catch (error) {
    console.error('매장 정보 추출 중 오류:', error);
  }
  
  return {
    totalStores: 0,
    directStores: 0,
    franchiseStores: 0,
    regionalHeadquarters: 0
  };
}

  private extractCostInfo(franchiseeCosts: any): any {
    try {
      const sections = franchiseeCosts?.sections || [];
      const costSection = sections.find(section => 
        section?.title === '가맹점사업자 부담금'
      );
      
      if (costSection?.data) {
        const costData = costSection.data.reduce((acc, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {});
        
        return {
          joinFee: costData.join_fee || "0",
          educationFee: costData.education_fee || "0",
          securityDeposit: costData.security_deposit || "0",
          totalInitialCost: costData.total || "0"
        };
      }
    } catch {}
    
    return {
      joinFee: "0",
      educationFee: "0",
      securityDeposit: "0",
      totalInitialCost: "0"
    };
  }

  private extractContractInfo(businessTerms: any): any {
    // businessTerms에서 계약 정보가 없는 경우가 많아서 기본값 반환
    return {
      initialPeriodYears: 3,
      extensionPeriodYears: 2
    };
  }

  private extractLegalInfo(legalCompliance: any): any {
    try {
      const sections = legalCompliance?.sections || [];
      const legalSection = sections.find(section => 
        section?.title === '법 위반 사실'
      );
      
      if (legalSection?.data) {
        const legalData = legalSection.data.reduce((acc, item) => {
          acc[item.key] = parseInt(item.value) || 0;
          return acc;
        }, {});
        
        return {
          ftcCorrections: legalData.ftc_correction || 0,
          civilLawsuits: legalData.civil_lawsuit || 0,
          criminalConvictions: legalData.criminal_conviction || 0
        };
      }
    } catch {}
    
    return {
      ftcCorrections: 0,
      civilLawsuits: 0,
      criminalConvictions: 0
    };
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