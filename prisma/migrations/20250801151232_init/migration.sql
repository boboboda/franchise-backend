-- CreateTable
CREATE TABLE "public"."franchises" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "jngIfrmpSn" TEXT NOT NULL,
    "corpNm" TEXT NOT NULL,
    "brandNm" TEXT NOT NULL,
    "brno" TEXT,
    "jngIfrmpRgsno" TEXT NOT NULL,
    "viwerUrl" TEXT NOT NULL,

    CONSTRAINT "franchises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."franchise_details" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "franchiseId" TEXT NOT NULL,
    "businessType" TEXT,
    "foundedYear" INTEGER,
    "totalStores" INTEGER,
    "franchiseStores" INTEGER,
    "directStores" INTEGER,
    "franchiseFee" DECIMAL(65,30),
    "initialCost" DECIMAL(65,30),
    "interiorCost" DECIMAL(65,30),
    "supportInfo" TEXT,
    "contractPeriod" TEXT,
    "territory" TEXT,
    "rawData" JSONB,

    CONSTRAINT "franchise_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."data_sync_status" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "syncType" TEXT NOT NULL,
    "lastSyncAt" TIMESTAMP(3) NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "syncedCount" INTEGER NOT NULL,
    "failedCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,

    CONSTRAINT "data_sync_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "franchises_jngIfrmpSn_key" ON "public"."franchises"("jngIfrmpSn");

-- CreateIndex
CREATE UNIQUE INDEX "franchise_details_franchiseId_key" ON "public"."franchise_details"("franchiseId");

-- AddForeignKey
ALTER TABLE "public"."franchise_details" ADD CONSTRAINT "franchise_details_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "public"."franchises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
