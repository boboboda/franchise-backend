/*
  Warnings:

  - The primary key for the `franchises` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `brandNm` on the `franchises` table. All the data in the column will be lost.
  - You are about to drop the column `brno` on the `franchises` table. All the data in the column will be lost.
  - You are about to drop the column `corpNm` on the `franchises` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `franchises` table. All the data in the column will be lost.
  - You are about to drop the column `jngIfrmpRgsno` on the `franchises` table. All the data in the column will be lost.
  - You are about to drop the column `jngIfrmpSn` on the `franchises` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `franchises` table. All the data in the column will be lost.
  - You are about to drop the column `viwerUrl` on the `franchises` table. All the data in the column will be lost.
  - The `id` column on the `franchises` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `data_sync_status` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `franchise_details` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."UserType" AS ENUM ('ENTREPRENEUR', 'CONSULTANT');

-- DropForeignKey
ALTER TABLE "public"."franchise_details" DROP CONSTRAINT "franchise_details_franchiseId_fkey";

-- DropIndex
DROP INDEX "public"."franchises_jngIfrmpSn_key";

-- AlterTable
ALTER TABLE "public"."franchises" DROP CONSTRAINT "franchises_pkey",
DROP COLUMN "brandNm",
DROP COLUMN "brno",
DROP COLUMN "corpNm",
DROP COLUMN "createdAt",
DROP COLUMN "jngIfrmpRgsno",
DROP COLUMN "jngIfrmpSn",
DROP COLUMN "updatedAt",
DROP COLUMN "viwerUrl",
ADD COLUMN     "basic_info" JSONB,
ADD COLUMN     "brand_name" VARCHAR,
ADD COLUMN     "business_status" JSONB,
ADD COLUMN     "business_terms" JSONB,
ADD COLUMN     "company_id" VARCHAR,
ADD COLUMN     "company_name" VARCHAR,
ADD COLUMN     "crawled_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "franchisee_costs" JSONB,
ADD COLUMN     "legal_compliance" JSONB,
ADD COLUMN     "url" VARCHAR,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "franchises_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "public"."data_sync_status";

-- DropTable
DROP TABLE "public"."franchise_details";

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "userType" "public"."UserType" NOT NULL DEFAULT 'ENTREPRENEUR',
    "fcmToken" TEXT,
    "termsAgreed" BOOLEAN NOT NULL DEFAULT false,
    "marketingAgreed" BOOLEAN NOT NULL DEFAULT false,
    "autoLoginState" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");
