// src/franchise/franchise.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FranchiseCategory } from './dto/franchise.dto';
import { FranchiseFilterDto } from './dto/franchise-filter.dto';

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
    : { companyId: 'desc' as const };    // 최신순 (실시간)

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
  async getFranchiseById(companyId: number) {
    const franchise = await this.prisma.franchise.findUnique({
      where: { companyId }
    });
    return franchise ? this.transformToDetailData(franchise) : null;
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


async getMetadata() {
  const lastRecord = await this.prisma.franchise.findFirst({
    orderBy: { companyId: 'desc' },
    select: { companyId: true }
  });

  return {
    success: true,
    data: {
      lastCompanyId: lastRecord?.companyId || 0  // 숫자로 변경
    }
  };
}


/**
   * 고급 필터로 프랜차이즈 조회
   * 
   * @param filterDto - 필터 조건
   * @returns 필터링된 프랜차이즈 목록 (페이징)
   * 
   * 동작 방식:
   * 1. 모든 프랜차이즈 데이터 로드 (Prisma는 JSON 필드 필터가 제한적)
   * 2. JavaScript로 메모리 필터링
   * 3. 페이징 적용
   */
 /**
 * ✅ 수정된 filterFranchises 메서드
 * 
 * 변경사항:
 * 1. 디테일 API의 extractStoreInfo, extractFinancialInfo 등 헬퍼 메서드 재사용
 * 2. sections 배열 탐색으로 정확한 데이터 추출
 * 3. 디버깅 로그 추가로 실제 값 확인 가능
 */

async filterFranchises(filterDto: FranchiseFilterDto) {
  const {
    minInvestment,
    maxInvestment,
    minRevenue,
    maxRevenue,
    minStores,
    maxStores,
    maxTerminationRate,
    hasRoyalty,
    category,
    page = 1,
    size = 20,
    sortOrder = 'desc'
  } = filterDto;

  const skip = (page - 1) * size;

  console.log('═══════════════════════════════════════════════');
  console.log('🔍 [필터] 고급 필터 요청 시작');
  console.log('📋 [필터] 조건:', JSON.stringify(filterDto, null, 2));
  console.log('═══════════════════════════════════════════════');

  // ============ STEP 1: 데이터베이스에서 모든 프랜차이즈 로드 ============
  const allFranchises = await this.prisma.franchise.findMany({
    orderBy: sortOrder === 'desc' 
      ? { crawledAt: 'desc' }
      : { companyId: 'asc' }
  });

  console.log(`✅ [필터] 총 ${allFranchises.length}개 프랜차이즈 로드 완료`);

  // ============ STEP 2: 메모리에서 필터링 (디테일 API 방식 사용) ============
  let debugCount = 0;
  const filtered = allFranchises.filter(franchise => {
    const basicInfo = franchise.basicInfo as any || {};
    const businessStatus = franchise.businessStatus as any || {};

    // 🔹 디버깅: 첫 3개 항목만 상세 로그
    if (debugCount < 3) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📊 [샘플 ${debugCount + 1}] ${franchise.brandName || '이름없음'}`);
      console.log(`   companyId: ${franchise.companyId}`);
      debugCount++;
    }

    // ============ 카테고리 필터 ============
    if (category) {
      const franchiseCategory = this.extractCategory(basicInfo);
      
      if (debugCount <= 3) {
        console.log(`   📁 카테고리: ${franchiseCategory} (조건: ${category})`);
      }

      if (franchiseCategory !== category) {
        if (debugCount <= 3) console.log(`   ❌ 카테고리 불일치 → 제외`);
        return false;
      }
    }

    // ============ 투자금 필터 ============
    // 🔹 디테일 API의 extractCostInfo 방식 사용
    const costInfo = this.extractCostInfo(franchise.franchiseeCosts);
    
    // 문자열을 숫자로 변환 (예: "5000만원" → 50000000)
    const totalInvestment = this.parseKoreanCurrency(costInfo.totalInitialCost);

    if (debugCount <= 3) {
      console.log(`   💰 투자금: ${totalInvestment.toLocaleString()}원`);
      console.log(`      - 가맹비: ${costInfo.joinFee}`);
      console.log(`      - 교육비: ${costInfo.educationFee}`);
      console.log(`      - 보증금: ${costInfo.securityDeposit}`);
      console.log(`   조건: ${minInvestment?.toLocaleString() || '제한없음'} ~ ${maxInvestment?.toLocaleString() || '제한없음'}`);
    }

    if (minInvestment !== undefined && totalInvestment < minInvestment) {
      if (debugCount <= 3) console.log(`   ❌ 최소 투자금 미만 → 제외`);
      return false;
    }
    if (maxInvestment !== undefined && totalInvestment > maxInvestment) {
      if (debugCount <= 3) console.log(`   ❌ 최대 투자금 초과 → 제외`);
      return false;
    }

    // ============ 매출 필터 ============
    // 🔹 디테일 API의 extractSalesInfo 방식 사용
    const avgRevenue = this.extractAverageSales(basicInfo);

    if (debugCount <= 3) {
      console.log(`   📈 평균 매출: ${avgRevenue.toLocaleString()}원`);
      console.log(`   조건: ${minRevenue?.toLocaleString() || '제한없음'} ~ ${maxRevenue?.toLocaleString() || '제한없음'}`);
    }

    if (minRevenue !== undefined && avgRevenue < minRevenue) {
      if (debugCount <= 3) console.log(`   ❌ 최소 매출 미만 → 제외`);
      return false;
    }
    if (maxRevenue !== undefined && avgRevenue > maxRevenue) {
      if (debugCount <= 3) console.log(`   ❌ 최대 매출 초과 → 제외`);
      return false;
    }

    // ============ 가맹점 수 필터 ============
    // 🔹 디테일 API의 extractStoreInfo 방식 사용
    const storeInfo = this.extractStoreInfo(businessStatus);
    const totalStores = storeInfo.totalStores;

    if (debugCount <= 3) {
      console.log(`   🏪 가맹점 수: ${totalStores}개`);
      console.log(`      - 직영: ${storeInfo.directStores}개`);
      console.log(`      - 가맹: ${storeInfo.franchiseStores}개`);
      console.log(`   조건: ${minStores || '제한없음'} ~ ${maxStores || '제한없음'}`);
    }

    if (minStores !== undefined && totalStores < minStores) {
      if (debugCount <= 3) console.log(`   ❌ 최소 점포수 미만 → 제외`);
      return false;
    }
    if (maxStores !== undefined && totalStores > maxStores) {
      if (debugCount <= 3) console.log(`   ❌ 최대 점포수 초과 → 제외`);
      return false;
    }

    // ============ 해지율 필터 ============
    const terminationRate = this.extractTerminationRate(businessStatus);

    if (debugCount <= 3) {
      console.log(`   📉 해지율: ${terminationRate}%`);
      console.log(`   조건: ${maxTerminationRate || '제한없음'}% 이하`);
    }

    if (maxTerminationRate !== undefined && terminationRate > maxTerminationRate) {
      if (debugCount <= 3) console.log(`   ❌ 최대 해지율 초과 → 제외`);
      return false;
    }

    // ============ 로열티 유무 필터 ============
    if (hasRoyalty !== undefined) {
      const royaltyRate = this.extractRoyaltyRate(basicInfo);
      const hasRoyaltyValue = royaltyRate > 0;

      if (debugCount <= 3) {
        console.log(`   👑 로열티: ${royaltyRate}% (${hasRoyaltyValue ? '있음' : '없음'})`);
        console.log(`   조건: ${hasRoyalty ? '있음' : '없음'}`);
      }

      if (hasRoyalty !== hasRoyaltyValue) {
        if (debugCount <= 3) console.log(`   ❌ 로열티 조건 불일치 → 제외`);
        return false;
      }
    }

    // ✅ 모든 조건 통과
    if (debugCount <= 3) {
      console.log(`   ✅ 모든 조건 통과 → 포함`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    }
    
    return true;
  });

  console.log(`\n═══════════════════════════════════════════════`);
  console.log(`✅ [필터] 필터 적용 후 ${filtered.length}개 프랜차이즈 남음`);
  console.log(`═══════════════════════════════════════════════\n`);

  // ============ STEP 3: 페이징 적용 ============
  const paginatedData = filtered.slice(skip, skip + size);

  console.log(`📄 [페이징] ${page}페이지 (${skip + 1} ~ ${skip + size}): ${paginatedData.length}개 반환\n`);

  // ============ STEP 4: 응답 데이터 변환 ============
  return {
    content: paginatedData.map(f => this.transformToListItem(f)),
    totalElements: filtered.length,
    totalPages: Math.ceil(filtered.length / size),
    currentPage: page,
    size: size,
    hasNext: page < Math.ceil(filtered.length / size),
    hasPrevious: page > 1
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛠️ 새로 추가된 헬퍼 메서드들 (디테일 API에서 재사용)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 평균 매출 추출
 */
private extractAverageSales(basicInfo: any): number {
  try {
    const sections = basicInfo?.sections || [];
    for (const section of sections) {
      if (section?.data && Array.isArray(section.data)) {
        const salesItem = section.data.find(item => 
          item?.title?.includes('평균매출') || item?.title?.includes('평균 매출')
        );
        if (salesItem?.value) {
          return this.parseKoreanCurrency(salesItem.value);
        }
      }
    }
  } catch {}
  return 0;
}

/**
 * 해지율 추출
 */
private extractTerminationRate(businessStatus: any): number {
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
          
          // 해지율 = (계약종료 / 총 가맹점) * 100
          const terminated = parseInt(latestData.contract_end) || 0;
          const total = parseInt(latestData.total) || 0;
          
          if (total > 0) {
            return (terminated / total) * 100;
          }
        }
      }
    }
  } catch {}
  return 0;
}

/**
 * 로열티율 추출
 */
private extractRoyaltyRate(basicInfo: any): number {
  try {
    const sections = basicInfo?.sections || [];
    for (const section of sections) {
      if (section?.data && Array.isArray(section.data)) {
        const royaltyItem = section.data.find(item => 
          item?.title?.includes('로열티') || item?.title?.includes('Royalty')
        );
        if (royaltyItem?.value) {
          // "5%", "5.5%", "없음" 등 처리
          const match = royaltyItem.value.match(/(\d+\.?\d*)/);
          return match ? parseFloat(match[1]) : 0;
        }
      }
    }
  } catch {}
  return 0;
}

/**
 * 한국 통화 문자열을 숫자로 변환
 * 예: "5000만원" → 50000000, "1억 5000만원" → 150000000
 */
private parseKoreanCurrency(value: string): number {
  if (!value || value === "0" || value === "..") return 0;

  try {
    // 숫자만 추출
    const numberMatch = value.match(/[\d,]+/g);
    if (!numberMatch) return 0;

    let total = 0;

    // "억" 단위
    if (value.includes('억')) {
      const eokMatch = value.match(/([\d,]+)\s*억/);
      if (eokMatch) {
        const eokValue = parseInt(eokMatch[1].replace(/,/g, ''));
        total += eokValue * 100000000;
      }
    }

    // "만" 단위
    if (value.includes('만')) {
      const manMatch = value.match(/([\d,]+)\s*만/);
      if (manMatch) {
        const manValue = parseInt(manMatch[1].replace(/,/g, ''));
        total += manValue * 10000;
      }
    }

    // 단순 숫자 (단위 없음)
    if (!value.includes('억') && !value.includes('만')) {
      total = parseInt(value.replace(/,/g, ''));
    }

    return total;
  } catch {
    return 0;
  }
}

  /**
   * 프랜차이즈 데이터를 리스트 아이템 형태로 변환
   * (기존 메서드 재사용)
   */
  // 목록용 변환 (간단한 데이터)
private transformToListItem(franchise: any) {
    const basicInfo = franchise.basicInfo;
    const businessStatus = franchise.businessStatus;

    return {
        id: franchise.companyId,  // ✅ 추가!
        name: franchise.companyName || franchise.brandName || "정보 없음",  // ✅ 추가!
        companyId: franchise.companyId,
        companyName: franchise.companyName,
        brandName: franchise.brandName,
        category: this.extractCategory(basicInfo),
        ceo: this.extractCeoName(basicInfo),
        businessType: this.extractBusinessType(basicInfo),
        address: this.extractAddress(basicInfo),
        phone: this.extractPhone(basicInfo),
        status: this.determineStatus(franchise),
        imageUrl: null,
        totalStores: businessStatus?.totalStores || 0,
        directStores: businessStatus?.directStores || 0,
        franchiseStores: businessStatus?.franchiseStores || 0,
        establishedDate: this.extractEstablishedDate(basicInfo) || "",
        registrationNumber: this.extractRegistrationNumber(basicInfo) || "",
        createdAt: franchise.crawledAt,
        updatedAt: franchise.updatedAt
    };
}

}
