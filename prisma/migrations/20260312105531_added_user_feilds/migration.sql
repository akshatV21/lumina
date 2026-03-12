-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('public', 'private');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "type" "AccountType" NOT NULL DEFAULT 'public';
