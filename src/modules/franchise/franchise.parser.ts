// src/modules/franchise/franchise.parser.ts

/**
 * FranchiseParser
 * 
 * 공정위 정보공개서 JSON 데이터를 파싱하는 공통 클래스
 * 목록 API, 디테일 API, 필터 API 모두 이 파서를 사용
 */
export class FranchiseParser {
  
  /**
   * 사업 현황 데이터 파싱
   * 
   * @param businessStatus - 원본 사업현황 JSON
   * @returns 파싱된 사업현황 데이터
   */
  parseBusinessStatus(businessStatus: any): ParsedBusinessStatus {
    try {
      const sections = businessStatus?.sections || [];
      
      // 1. 가맹점 수 추출
      const storeSection = sections.find(s => s?.title?.includes('가맹점 및 직영점 현황'));
      let totalStores = 0;
      let directStores = 0;
      let franchiseStores = 0;
      
      if (storeSection?.data) {
        const allRegionData = storeSection.data.find(region => region.region === '전체');
        if (allRegionData?.year_data) {
          const latestYear = Object.keys(allRegionData.year_data).sort().pop();
          
          if (latestYear && allRegionData.year_data[latestYear]) {
            const latestData = allRegionData.year_data[latestYear];
            totalStores = this.parseNumber(latestData.total);
            directStores = this.parseNumber(latestData.direct_count);
            franchiseStores = this.parseNumber(latestData.franchise_count);
          }
        }
      }
      
      // 2. 해지율 추출
      const changeSection = sections.find(s => s?.title?.includes('가맹점 변동 현황'));
      let terminationRate = 0;
      
      if (changeSection?.data) {
        const latestYearData = changeSection.data[changeSection.data.length - 1];
        if (latestYearData) {
          const terminated = this.parseNumber(latestYearData.contract_terminations);
          const cancelled = this.parseNumber(latestYearData.contract_cancellations);
          const totalClosed = terminated + cancelled;
          
          if (totalStores > 0) {
            terminationRate = (totalClosed / totalStores) * 100;
          }
        }
      }
      
      return {
        totalStores,
        directStores,
        franchiseStores,
        terminationRate
      };
      
    } catch (error) {
      console.error('❌ [Parser] 사업현황 파싱 실패:', error);
      return {
        totalStores: 0,
        directStores: 0,
        franchiseStores: 0,
        terminationRate: 0
      };
    }
  }
  
  /**
   * 재무 정보 파싱 (가맹비, 교육비, 보증금 등)
   * 
   * @param franchiseeCosts - 원본 가맹점사업자부담금 JSON
   * @returns 파싱된 재무 정보
   */
  parseFinancialInfo(franchiseeCosts: any): ParsedFinancialInfo {
    try {
      const sections = franchiseeCosts?.sections || [];
      const costSection = sections.find(s => s?.title?.includes('가맹점사업자 부담금'));
      
      let franchiseFee = 0;
      let educationFee = 0;
      let deposit = 0;
      let interiorCost = 0;
      let royaltyRate = 0;
      
      if (costSection?.data) {
        const costData = costSection.data;
        
        // 배열 형태일 경우
        if (Array.isArray(costData)) {
          for (const item of costData) {
            switch (item.key) {
              case 'join_fee':
              case '가맹비':
                franchiseFee = this.parseNumber(item.value);
                break;
              case 'education_fee':
              case '교육비':
                educationFee = this.parseNumber(item.value);
                break;
              case 'security_deposit':
              case '보증금':
                deposit = this.parseNumber(item.value);
                break;
              case 'interior_cost':
              case '인테리어비용':
                interiorCost = this.parseNumber(item.value);
                break;
              case 'royalty_rate':
              case '로열티':
                royaltyRate = this.parseRate(item.value);
                break;
            }
          }
        }
        // 객체 형태일 경우
        else {
          franchiseFee = this.parseNumber(costData.join_fee || costData.가맹비);
          educationFee = this.parseNumber(costData.education_fee || costData.교육비);
          deposit = this.parseNumber(costData.security_deposit || costData.보증금);
          interiorCost = this.parseNumber(costData.interior_cost || costData.인테리어비용);
          royaltyRate = this.parseRate(costData.royalty_rate || costData.로열티);
        }
      }
      
      const totalInvestment = franchiseFee + educationFee + deposit + interiorCost;
      
      return {
        franchiseFee,
        educationFee,
        deposit,
        interiorCost,
        royaltyRate,
        totalInvestment
      };
      
    } catch (error) {
      console.error('❌ [Parser] 재무정보 파싱 실패:', error);
      return {
        franchiseFee: 0,
        educationFee: 0,
        deposit: 0,
        interiorCost: 0,
        royaltyRate: 0,
        totalInvestment: 0
      };
    }
  }
  
  /**
   * 매출 정보 파싱
   * 
   * @param businessStatus - 원본 사업현황 JSON
   * @returns 파싱된 매출 정보
   */
  parseSalesInfo(businessStatus: any): ParsedSalesInfo {
    try {
      const sections = businessStatus?.sections || [];
      const salesSection = sections.find(s => 
        s?.title?.includes('가맹점 평균 매출액') || 
        s?.title?.includes('매출 현황')
      );
      
      let averageSales = 0;
      let medianSales = 0;
      
      if (salesSection?.data) {
        // 테이블 형태의 데이터일 경우
        if (Array.isArray(salesSection.data)) {
          const latestYearData = salesSection.data[salesSection.data.length - 1];
          
          if (latestYearData) {
            averageSales = this.parseNumber(latestYearData.average_sales || latestYearData.평균매출);
            medianSales = this.parseNumber(latestYearData.median_sales || latestYearData.중위매출);
          }
        }
        // 단일 객체일 경우
        else {
          averageSales = this.parseNumber(salesSection.data.average_sales || salesSection.data.평균매출);
          medianSales = this.parseNumber(salesSection.data.median_sales || salesSection.data.중위매출);
        }
      }
      
      return {
        averageSales,
        medianSales
      };
      
    } catch (error) {
      console.error('❌ [Parser] 매출정보 파싱 실패:', error);
      return {
        averageSales: 0,
        medianSales: 0
      };
    }
  }
  
  /**
   * 카테고리 추출
   * 
   * @param basicInfo - 원본 기본정보 JSON
   * @returns 카테고리 문자열
   */
  parseCategory(basicInfo: any): string {
    try {
      const sections = basicInfo?.sections || [];
      
      for (const section of sections) {
        if (section?.data && Array.isArray(section.data)) {
          const categoryItem = section.data.find(item => 
            item?.title === '업종' || item?.title === 'category'
          );
          
          if (categoryItem?.value) {
            return categoryItem.value;
          }
        }
      }
      
      return '미분류';
    } catch {
      return '미분류';
    }
  }
  
  /**
   * 사업자 유형 추출
   * 
   * @param basicInfo - 원본 기본정보 JSON
   * @returns 사업자 유형 (법인/개인)
   */
  parseBusinessType(basicInfo: any): string {
    try {
      const sections = basicInfo?.sections || [];
      
      for (const section of sections) {
        if (section?.data && Array.isArray(section.data)) {
          const typeItem = section.data.find(item => 
            item?.title === '사업자유형' || item?.title === 'business_type'
          );
          
          if (typeItem?.value) {
            return typeItem.value;
          }
        }
      }
      
      return '법인';
    } catch {
      return '법인';
    }
  }
  
  // ============ 유틸리티 메서드 ============
  
  /**
   * 숫자 파싱 (콤마 제거, 단위 처리)
   * 
   * @param value - 원본 값 (예: "1,000만원", "50000000")
   * @returns 숫자
   */
  private parseNumber(value: any): number {
    if (typeof value === 'number') {
      return value;
    }
    
    if (typeof value !== 'string') {
      return 0;
    }
    
    // 콤마 제거
    let cleaned = value.replace(/,/g, '');
    
    // 단위 처리
    if (cleaned.includes('억')) {
      const num = parseFloat(cleaned.replace(/[^0-9.]/g, ''));
      return num * 100000000;
    }
    
    if (cleaned.includes('만')) {
      const num = parseFloat(cleaned.replace(/[^0-9.]/g, ''));
      return num * 10000;
    }
    
    // 그냥 숫자
    const num = parseFloat(cleaned.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  }
  
  /**
   * 비율 파싱 (% 처리)
   * 
   * @param value - 원본 값 (예: "5.2%", "0.052")
   * @returns 비율 (0~100 범위)
   */
  private parseRate(value: any): number {
    if (typeof value === 'number') {
      return value > 1 ? value : value * 100;
    }
    
    if (typeof value !== 'string') {
      return 0;
    }
    
    const num = parseFloat(value.replace(/[^0-9.]/g, ''));
    
    if (isNaN(num)) {
      return 0;
    }
    
    // 이미 % 형태면 그대로, 아니면 100 곱하기
    return value.includes('%') ? num : num * 100;
  }
}

// ============ 타입 정의 ============

export interface ParsedBusinessStatus {
  totalStores: number;
  directStores: number;
  franchiseStores: number;
  terminationRate: number;
}

export interface ParsedFinancialInfo {
  franchiseFee: number;
  educationFee: number;
  deposit: number;
  interiorCost: number;
  royaltyRate: number;
  totalInvestment: number;
}

export interface ParsedSalesInfo {
  averageSales: number;
  medianSales: number;
}