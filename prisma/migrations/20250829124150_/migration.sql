/*
  Warnings:

  - A unique constraint covering the columns `[company_id]` on the table `franchises` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `franchises` table without a default value. This is not possible if the table is not empty.
  - Made the column `basic_info` on table `franchises` required. This step will fail if there are existing NULL values in that column.
  - Made the column `business_status` on table `franchises` required. This step will fail if there are existing NULL values in that column.
  - Made the column `business_terms` on table `franchises` required. This step will fail if there are existing NULL values in that column.
  - Made the column `company_id` on table `franchises` required. This step will fail if there are existing NULL values in that column.
  - Made the column `crawled_at` on table `franchises` required. This step will fail if there are existing NULL values in that column.
  - Made the column `franchisee_costs` on table `franchises` required. This step will fail if there are existing NULL values in that column.
  - Made the column `legal_compliance` on table `franchises` required. This step will fail if there are existing NULL values in that column.
  - Made the column `url` on table `franchises` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."franchises" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "basic_info" SET NOT NULL,
ALTER COLUMN "brand_name" SET DATA TYPE TEXT,
ALTER COLUMN "business_status" SET NOT NULL,
ALTER COLUMN "business_terms" SET NOT NULL,
ALTER COLUMN "company_id" SET NOT NULL,
ALTER COLUMN "company_id" SET DATA TYPE TEXT,
ALTER COLUMN "company_name" SET DATA TYPE TEXT,
ALTER COLUMN "crawled_at" SET NOT NULL,
ALTER COLUMN "crawled_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "franchisee_costs" SET NOT NULL,
ALTER COLUMN "legal_compliance" SET NOT NULL,
ALTER COLUMN "url" SET NOT NULL,
ALTER COLUMN "url" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "franchises_company_id_key" ON "public"."franchises"("company_id");

-- CreateIndex
CREATE INDEX "franchises_company_id_idx" ON "public"."franchises"("company_id");

-- CreateIndex
CREATE INDEX "franchises_company_name_idx" ON "public"."franchises"("company_name");

-- CreateIndex
CREATE INDEX "franchises_brand_name_idx" ON "public"."franchises"("brand_name");
