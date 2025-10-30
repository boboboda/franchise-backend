// src/modules/franchise/franchise.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FranchiseFilterDto } from './dto/franchise-filter.dto';
import { FranchiseParser } from './franchise.parser';

@Injectable()
export class FranchiseService {
  // 공통 파서 인스턴스
  private parser = new FranchiseParser();

  constructor(private prisma: PrismaService) {}

  /**
   * 프랜차이즈 목록 조회 (페이징)
   */
  async getFranchises(page: number = 1, size: number = 20, sortOrder: 'asc' | 'desc' = 'asc') {
    const skip = (page - 1) * size;

    const [franchises, totalCount] = await Promise.all([
      this.prisma.franchise.findMany({
        skip,
        take: size,
        orderBy: sortOrder === 'desc' 
          ? { crawledAt: 'desc' }
          : { companyId: 'asc' }
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

  /**
   * 프랜차이즈 상세 조회
   */
  async getFranchiseById(id: number) {
    const franchise = await this.prisma.franchise.findUnique({
      where: { companyId: id }
    });

    return franchise ? this.transformToDetailData(franchise) : null;
  }

  /**
   * 메타데이터 조회 (마지막 companyId)
   */
  async getMetadata() {
    const lastRecord = await this.prisma.franchise.findFirst({
      orderBy: { companyId: 'desc' },
      select: { companyId: true }
    });

    return {
      success: true,
      data: {
        lastCompanyId: lastRecord?.companyId || 0
      }
    };
  }

  /**
   * 카테고리 목록 조회
   */
  async getCategories() {
    try {
      const franchises = await this.prisma.franchise.findMany({
        select: {
          basicInfo: true
        }
      });

      const categoryCountMap = new Map<string, number>();

      franchises.forEach(franchise => {
        const category = this.parser.parseCategory(franchise.basicInfo);
        const currentCount = categoryCountMap.get(category) || 0;
        categoryCountMap.set(category, currentCount + 1);
      });

      const categories = Array.from(categoryCountMap.entries())
        .map(([name, count]) => ({
          name: name,
          count: count
        }))
        .sort((a, b) => b.count - a.count);

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

  /**
   * 브랜드 검색
   */
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

  /**
   * 카테고리별 프랜차이즈 조회
   */
  async getFranchisesByCategory(category: string, page: number = 1, size: number = 20, sortOrder: 'asc' | 'desc' = 'asc') {
    const skip = (page - 1) * size;
    
    const orderBy = sortOrder === 'asc' 
      ? { companyId: 'asc' as const }
      : { crawledAt: 'desc' as const };
    
    try {
      const allFranchises = await this.prisma.franchise.findMany({
        orderBy: orderBy,
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

      const filteredFranchises = allFranchises.filter(franchise => {
        if (category === 'ALL' || category === '전체') {
          return true;
        }
        
        const extractedCategory = this.parser.parseCategory(franchise.basicInfo);
        return extractedCategory === category;
      });

      const totalCount = filteredFranchises.length;
      const paginatedFranchises = filteredFranchises.slice(skip, skip + size);

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

  /**
   * 고급 필터로 프랜차이즈 조회
   * 
   * ✅ 파서를 사용해서 올바른 데이터 추출
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

    console.log('🔍 [필터] 데이터베이스에서 프랜차이즈 로드 중...');
    
    const allFranchises = await this.prisma.franchise.findMany({
      orderBy: sortOrder === 'desc' 
        ? { crawledAt: 'desc' }
        : { companyId: 'asc' }
    });

    console.log(`✅ [필터] 총 ${allFranchises.length}개 프랜차이즈 로드 완료`);
    console.log('🔧 [필터] 필터 조건 적용 중...');
    
    // ============ 파서를 사용한 필터링 ============
    let debugSampleShown = false;
    
    const filtered = allFranchises.filter((franchise, index) => {
      const basicInfo = franchise.basicInfo as any || {};
      const businessStatus = franchise.businessStatus as any || {};
      const franchiseeCosts = franchise.franchiseeCosts as any || {};

      // ✅ 파서로 데이터 추출
      const parsedBusiness = this.parser.parseBusinessStatus(businessStatus);
      const parsedFinancial = this.parser.parseFinancialInfo(franchiseeCosts);
      const parsedSales = this.parser.parseSalesInfo(businessStatus);
      const parsedCategory = this.parser.parseCategory(basicInfo);

      // 🐛 첫 번째 아이템 디버깅
      if (!debugSampleShown && index === 0) {
        console.log('🐛 [디버깅] 첫 번째 프랜차이즈 파싱 결과:');
        console.log('  - companyId:', franchise.companyId);
        console.log('  - brandName:', franchise.brandName);
        console.log('  - parsedBusiness:', parsedBusiness);
        console.log('  - parsedFinancial:', parsedFinancial);
        console.log('  - parsedSales:', parsedSales);
        console.log('  - parsedCategory:', parsedCategory);
        console.log('  - 필터 조건:');
        console.log('    * minInvestment:', minInvestment);
        console.log('    * maxInvestment:', maxInvestment);
        console.log('    * 파싱된 투자금:', parsedFinancial.totalInvestment);
        console.log('    * 통과 여부:', 
          minInvestment === undefined || parsedFinancial.totalInvestment >= minInvestment,
          '&&',
          maxInvestment === undefined || parsedFinancial.totalInvestment <= maxInvestment
        );
        debugSampleShown = true;
      }

      // ---------- 카테고리 필터 ----------
      if (category && parsedCategory !== category) {
        return false;
      }

      // ---------- 투자금 필터 ----------
      if (minInvestment !== undefined && parsedFinancial.totalInvestment < minInvestment) {
        return false;
      }
      if (maxInvestment !== undefined && parsedFinancial.totalInvestment > maxInvestment) {
        return false;
      }

      // ---------- 매출 필터 ----------
      if (minRevenue !== undefined && parsedSales.averageSales < minRevenue) {
        return false;
      }
      if (maxRevenue !== undefined && parsedSales.averageSales > maxRevenue) {
        return false;
      }

      // ---------- 가맹점 수 필터 ----------
      if (minStores !== undefined && parsedBusiness.totalStores < minStores) {
        return false;
      }
      if (maxStores !== undefined && parsedBusiness.totalStores > maxStores) {
        return false;
      }

      // ---------- 해지율 필터 ----------
      if (maxTerminationRate !== undefined && parsedBusiness.terminationRate > maxTerminationRate) {
        return false;
      }

      // ---------- 로열티 유무 필터 ----------
      if (hasRoyalty !== undefined) {
        const hasRoyaltyValue = parsedFinancial.royaltyRate > 0;
        if (hasRoyalty !== hasRoyaltyValue) {
          return false;
        }
      }

      return true;
    });

    console.log(`✅ [필터] 필터 적용 후 ${filtered.length}개 프랜차이즈 남음`);

    // ============ 페이징 적용 ============
    const paginatedData = filtered.slice(skip, skip + size);

    console.log(`📄 [페이징] ${page}페이지: ${paginatedData.length}개 반환`);

    // ============ 응답 데이터 변환 (파서 사용) ============
    return {
      content: paginatedData.map(f => this.transformToFilterResponse(f)),
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
      currentPage: page,
      size: size,
      hasNext: page < Math.ceil(filtered.length / size),
      hasPrevious: page > 1,
      _debug: process.env.NODE_ENV === 'development' ? {
        appliedFilters: filterDto,
        totalBeforeFilter: allFranchises.length,
        totalAfterFilter: filtered.length
      } : undefined
    };
  }

  // ============ 매퍼 메서드들 ============

  /**
   * 목록용 변환 (간단한 정보)
   */
  private transformToListItem(franchise: any) {
    const basicInfo = franchise.basicInfo as any || {};
    const businessStatus = franchise.businessStatus as any || {};

    // ✅ 파서 사용
    const storeInfo = this.extractStoreInfo(businessStatus);
    
    return {
      companyId: franchise.companyId,
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
      establishedDate: this.extractEstablishedDate(basicInfo),
      registrationNumber: this.extractRegistrationNumber(basicInfo),
      createdAt: franchise.crawledAt,
      updatedAt: franchise.updatedAt
    };
  }

  /**
   * 필터용 변환 (필터링에 필요한 모든 정보 포함)
   * ✅ 파서를 사용해서 올바른 데이터 반환
   */
  private transformToFilterResponse(franchise: any) {
    const basicInfo = franchise.basicInfo as any || {};
    const businessStatus = franchise.businessStatus as any || {};
    const franchiseeCosts = franchise.franchiseeCosts as any || {};

    // ✅ 파서로 데이터 추출
    const parsedBusiness = this.parser.parseBusinessStatus(businessStatus);
    const parsedFinancial = this.parser.parseFinancialInfo(franchiseeCosts);
    const parsedSales = this.parser.parseSalesInfo(businessStatus);

    return {
      companyId: franchise.companyId,
      companyName: franchise.companyName,
      brandName: franchise.brandName,
      category: this.parser.parseCategory(basicInfo),
      businessType: this.parser.parseBusinessType(basicInfo),
      
      // ✅ 파싱된 데이터 사용
      totalStores: parsedBusiness.totalStores,
      directStores: parsedBusiness.directStores,
      franchiseStores: parsedBusiness.franchiseStores,
      terminationRate: parsedBusiness.terminationRate,
      
      averageSales: parsedSales.averageSales,
      medianSales: parsedSales.medianSales,
      
      franchiseFee: parsedFinancial.franchiseFee,
      educationFee: parsedFinancial.educationFee,
      deposit: parsedFinancial.deposit,
      interiorCost: parsedFinancial.interiorCost,
      totalInvestment: parsedFinancial.totalInvestment,
      royaltyRate: parsedFinancial.royaltyRate,
      hasRoyalty: parsedFinancial.royaltyRate > 0,
      
      crawledAt: franchise.crawledAt,
      updatedAt: franchise.updatedAt
    };
  }

  /**
   * 상세용 변환 (전체 데이터)
   */
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

  // ============ 기존 extract 메서드들 (유지) ============

  private extractCategory(basicInfo: any): string {
    return this.parser.parseCategory(basicInfo);
  }

  private extractCeoName(basicInfo: any): string {
    try {
      const sections = basicInfo?.sections || [];
      for (const section of sections) {
        if (section?.data && Array.isArray(section.data)) {
          const ceoItem = section.data.find(item => item?.title === '대표자');
          if (ceoItem?.value) return ceoItem.value;
        }
      }
      return "정보 없음";
    } catch {
      return "정보 없음";
    }
  }

  private extractBusinessType(basicInfo: any): string {
    return this.parser.parseBusinessType(basicInfo);
  }

  private extractAddress(basicInfo: any): string {
    try {
      const sections = basicInfo?.sections || [];
      for (const section of sections) {
        if (section?.data && Array.isArray(section.data)) {
          const addressItem = section.data.find(item => item?.title === '주소');
          if (addressItem?.value) return addressItem.value;
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
          const phoneItem = section.data.find(item => item?.title === '대표번호');
          if (phoneItem?.value) return phoneItem.value;
        }
      }
      return "전화번호 정보 없음";
    } catch {
      return "전화번호 정보 없음";
    }
  }

  private extractEstablishedDate(basicInfo: any): string {
    try {
      const sections = basicInfo?.sections || [];
      for (const section of sections) {
        if (section?.data && Array.isArray(section.data)) {
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

  private extractRegistrationNumber(basicInfo: any): string {
    try {
      const sections = basicInfo?.sections || [];
      for (const section of sections) {
        if (section?.data && Array.isArray(section.data)) {
          const regItem = section.data.find(item => item?.title === '등록번호');
          if (regItem?.value) return regItem.value;
        }
      }
      return "";
    } catch {
      return "";
    }
  }

  private determineStatus(franchise: any): string {
    const basicInfo = franchise.basicInfo;
    const businessStatus = franchise.businessStatus;
    const storeInfo = this.extractStoreInfo(businessStatus);
    
    const totalStores = storeInfo.totalStores;
    const establishedDate = this.extractEstablishedDate(basicInfo);
    
    if (totalStores >= 100) return "HOT";
    if (totalStores >= 50) return "POPULAR";
    
    if (establishedDate) {
      try {
        const established = new Date(establishedDate.replace(/\./g, '-'));
        const yearsDiff = (Date.now() - established.getTime()) / (1000 * 60 * 60 * 24 * 365);
        
        if (yearsDiff < 1) return "NEW";
        if (yearsDiff < 3 && totalStores >= 10) return "GROWING";
        if (yearsDiff >= 5) return "STABLE";
      } catch {}
    }
    
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
}