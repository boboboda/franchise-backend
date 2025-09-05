// src/franchise/franchise.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FranchiseCategory } from './dto/franchise.dto';

@Injectable()
export class FranchiseService {
  constructor(private prisma: PrismaService) {}

  // 카테고리 조회
  async getCategories() {
  try {
    // 모든 프랜차이즈의 basicInfo에서 업종 추출
    const franchises = await this.prisma.franchise.findMany({
      select: {
        basicInfo: true
      }
    });

    // 카테고리별 개수 집계
    const categoryCountMap = new Map<string, number>();

    franchises.forEach(franchise => {
      const category = this.extractCategory(franchise.basicInfo);
      const currentCount = categoryCountMap.get(category) || 0;
      categoryCountMap.set(category, currentCount + 1);
    });

    // Map을 배열로 변환하고 개수 기준으로 정렬
    const categories = Array.from(categoryCountMap.entries())
      .map(([name, count]) => ({
        name: name,
        count: count
      }))
      .sort((a, b) => b.count - a.count); // 개수 많은 순으로 정렬

    return {
      success: true,
      data: categories
    };
  } catch (error) {
    console.error('카테고리 조회 중 오류:', error);
    return {
      success: false,
      data: []
    };
  }
}

  // 목록 조회 (간단한 데이터)
 async getFranchises(page: number = 1, size: number = 20, sortOrder: 'asc' | 'desc' = 'asc') {
  const skip = (page - 1) * size;

  // 정렬 순서에 따른 orderBy 설정
  const orderBy = sortOrder === 'asc' 
    ? { companyId: 'asc' as const }      // 오래된순 (캐싱 최적화)
    : { crawledAt: 'desc' as const };    // 최신순 (실시간)

  const [franchises, totalCount] = await Promise.all([
    this.prisma.franchise.findMany({
      skip,
      take: size,
      orderBy: orderBy,  // 동적 정렬
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

  // 카테고리별 조회
 async getFranchisesByCategory(category: string, page: number = 1, size: number = 20, sortOrder: 'asc' | 'desc' = 'asc') {
  const skip = (page - 1) * size;
  
  // 정렬 순서에 따른 orderBy 설정
  const orderBy = sortOrder === 'asc' 
    ? { companyId: 'asc' as const }      // 오래된순 (캐싱 최적화)
    : { crawledAt: 'desc' as const };    // 최신순 (실시간)
  
  try {
    // 모든 프랜차이즈 데이터 조회 (정렬 적용)
    const allFranchises = await this.prisma.franchise.findMany({
      orderBy: orderBy,  // 동적 정렬
      select: {
        companyId: true,
        companyName: true,
        brandName: true,
        basicInfo: true,
        businessStatus: true,
        crawledAt: true,
        updatedAt: true
      }
    });

    // 카테고리 필터링 (메모리에서)
    const filteredFranchises = allFranchises.filter(franchise => {
      if (category === 'ALL' || category === '전체') {
        return true;
      }
      
      // extractCategory 메서드를 사용해서 실제 업종과 비교
      const extractedCategory = this.extractCategory(franchise.basicInfo);
      return extractedCategory === category;
    });

    // 수동 페이징
    const totalCount = filteredFranchises.length;
    const startIndex = skip;
    const endIndex = skip + size;
    const paginatedFranchises = filteredFranchises.slice(startIndex, endIndex);

    return this.createPagingResponse(
      paginatedFranchises.map(f => this.transformToListItem(f)),
      totalCount,
      page,
      size
    );

  } catch (error) {
    console.error('카테고리별 조회 중 오류:', error);
    return this.createPagingResponse([], 0, page, size);
  }
}

  // 검색
  async searchFranchises(query: string, page: number = 1, size: number = 20) {
    const skip = (page - 1) * size;

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

  // 상세 조회
  async getFranchiseById(id: string) {
    const franchise = await this.prisma.franchise.findUnique({
      where: { companyId: id }
    });

    return franchise ? this.transformToDetailData(franchise) : null;
  }

  // 목록용 변환 (가벼운 데이터)
  private transformToListItem(franchise: any) {
  const basicInfo = franchise.basicInfo;
  const businessStatus = franchise.businessStatus;
  const storeInfo = this.extractStoreInfo(businessStatus);

  return {
    id: franchise.companyId,
    name: franchise.companyName || franchise.brandName || "정보 없음",
    brandName: franchise.brandName || "정보 없음",
    category: this.extractCategory(basicInfo),
    ceo: this.extractCeoName(basicInfo),
    businessType: this.extractBusinessType(basicInfo),
    address: this.extractAddress(basicInfo),
    phone: this.extractPhone(basicInfo),
    status: this.determineStatus(franchise),
    imageUrl: null,
    totalStores: storeInfo.totalStores,
    directStores: storeInfo.directStores,
    franchiseStores: storeInfo.franchiseStores,
    establishedDate: this.extractEstablishedDate(basicInfo),     // 추가
    registrationNumber: this.extractRegistrationNumber(basicInfo), // 추가
    createdAt: franchise.crawledAt,
    updatedAt: franchise.updatedAt
  };
}


  // 상세용 변환 (전체 데이터)
  private transformToDetailData(franchise: any) {
    const basicInfo = franchise.basicInfo;
    const businessStatus = franchise.businessStatus;
    const franchiseeCosts = franchise.franchiseeCosts;
    const businessTerms = franchise.businessTerms;
    const legalCompliance = franchise.legalCompliance;

    return {
      id: franchise.companyId,
      name: franchise.companyName || franchise.brandName || "정보 없음",
      brandName: franchise.brandName || "정보 없음",
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

  // 데이터 추출 헬퍼 메서드들
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
  const basicInfo = franchise.basicInfo;
  const businessStatus = franchise.businessStatus;
  const storeInfo = this.extractStoreInfo(businessStatus);
  
  const totalStores = storeInfo.totalStores;
  const establishedDate = this.extractEstablishedDate(basicInfo);
  
  // 매장 수가 많으면 HOT
  if (totalStores >= 100) return "HOT";
  if (totalStores >= 50) return "POPULAR";
  
  // 사업 기간으로 판단
  if (establishedDate) {
    try {
      const established = new Date(establishedDate.replace(/\./g, '-'));
      const yearsDiff = (Date.now() - established.getTime()) / (1000 * 60 * 60 * 24 * 365);
      
      if (yearsDiff < 1) return "NEW";
      if (yearsDiff < 3 && totalStores >= 10) return "GROWING";
      if (yearsDiff >= 5) return "STABLE";
    } catch {}
  }
  
  // 기본값
  if (totalStores >= 10) return "STABLE";
  return "NEW";
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
    } catch {}
    
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

  // 설립일 추출 함수 추가
private extractEstablishedDate(basicInfo: any): string {
  try {
    const sections = basicInfo?.sections || [];
    for (const section of sections) {
      if (section?.data && Array.isArray(section.data)) {
        // 법인설립등기일 우선, 없으면 사업자등록일
        const establishedItem = section.data.find(item => 
          item?.title === '법인설립등기일' || item?.title === '사업자등록일'
        );
        if (establishedItem?.value && establishedItem.value !== "..") {
          return establishedItem.value;
        }
      }
    }
    return "";
  } catch {
    return "";
  }
}

// 등록번호 추출 함수 추가
private extractRegistrationNumber(basicInfo: any): string {
  try {
    const sections = basicInfo?.sections || [];
    for (const section of sections) {
      if (section?.data && Array.isArray(section.data)) {
        const regItem = section.data.find(item => 
          item?.title === '등록번호'
        );
        if (regItem?.value) {
          return regItem.value;
        }
      }
    }
    return "";
  } catch {
    return "";
  }
}
}