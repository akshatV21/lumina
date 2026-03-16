-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('processing', 'completed');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('image', 'video');

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "content" TEXT,
    "userId" TEXT NOT NULL,
    "status" "PostStatus" NOT NULL DEFAULT 'processing',
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostMedia" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "order" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "blurhash" TEXT,
    "width" INTEGER,
    "height" INTEGER,

    CONSTRAINT "PostMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Post_userId_status_hidden_createdAt_idx" ON "Post"("userId", "status", "hidden", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PostMedia_postId_idx" ON "PostMedia"("postId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostMedia" ADD CONSTRAINT "PostMedia_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
