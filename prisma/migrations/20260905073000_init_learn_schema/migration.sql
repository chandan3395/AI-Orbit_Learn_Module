-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('COURSE', 'GUIDE', 'EBOOK');

-- CreateEnum
CREATE TYPE "ResourceDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('TEXT', 'VIDEO', 'LINK');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "LessonProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Author" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningResource" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "type" "ResourceType" NOT NULL,
    "difficulty" "ResourceDifficulty" NOT NULL,
    "status" "ResourceStatus" NOT NULL DEFAULT 'DRAFT',
    "durationMinutes" INTEGER,
    "sourceUrl" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "authorId" UUID NOT NULL,
    "publishedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "LearningResource_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LearningResource_durationMinutes_check" CHECK ("durationMinutes" IS NULL OR "durationMinutes" >= 0)
);

-- CreateTable
CREATE TABLE "LearningResourceCategory" (
    "resourceId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,

    CONSTRAINT "LearningResourceCategory_pkey" PRIMARY KEY ("resourceId", "categoryId")
);

-- CreateTable
CREATE TABLE "LearningResourceTag" (
    "resourceId" UUID NOT NULL,
    "tagId" UUID NOT NULL,

    CONSTRAINT "LearningResourceTag_pkey" PRIMARY KEY ("resourceId", "tagId")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" UUID NOT NULL,
    "resourceId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "type" "LessonType" NOT NULL,
    "content" TEXT,
    "videoUrl" TEXT,
    "externalUrl" TEXT,
    "durationMinutes" INTEGER,
    "order" INTEGER NOT NULL,
    "isPreview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Lesson_durationMinutes_check" CHECK ("durationMinutes" IS NULL OR "durationMinutes" >= 0),
    CONSTRAINT "Lesson_order_check" CHECK ("order" >= 0)
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "resourceId" UUID NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "progressPercentage" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Enrollment_progressPercentage_check" CHECK ("progressPercentage" BETWEEN 0 AND 100)
);

-- CreateTable
CREATE TABLE "LessonProgress" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "lessonId" UUID NOT NULL,
    "status" "LessonProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "positionSeconds" INTEGER DEFAULT 0,
    "startedAt" TIMESTAMPTZ(3),
    "completedAt" TIMESTAMPTZ(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LessonProgress_positionSeconds_check" CHECK ("positionSeconds" IS NULL OR "positionSeconds" >= 0)
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "resourceId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Author_slug_key" ON "Author"("slug");
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");
CREATE UNIQUE INDEX "LearningResource_slug_key" ON "LearningResource"("slug");
CREATE INDEX "LearningResource_status_publishedAt_idx" ON "LearningResource"("status", "publishedAt" DESC);
CREATE INDEX "LearningResource_type_status_idx" ON "LearningResource"("type", "status");
CREATE INDEX "LearningResource_isFeatured_status_publishedAt_idx" ON "LearningResource"("isFeatured", "status", "publishedAt" DESC);
CREATE INDEX "LearningResource_authorId_status_publishedAt_idx" ON "LearningResource"("authorId", "status", "publishedAt" DESC);
CREATE INDEX "LearningResourceCategory_categoryId_resourceId_idx" ON "LearningResourceCategory"("categoryId", "resourceId");
CREATE INDEX "LearningResourceTag_tagId_resourceId_idx" ON "LearningResourceTag"("tagId", "resourceId");
CREATE UNIQUE INDEX "Lesson_resourceId_slug_key" ON "Lesson"("resourceId", "slug");
CREATE UNIQUE INDEX "Lesson_resourceId_order_key" ON "Lesson"("resourceId", "order");
CREATE INDEX "Enrollment_userId_status_lastAccessedAt_idx" ON "Enrollment"("userId", "status", "lastAccessedAt" DESC);
CREATE INDEX "Enrollment_resourceId_status_idx" ON "Enrollment"("resourceId", "status");
CREATE UNIQUE INDEX "Enrollment_userId_resourceId_key" ON "Enrollment"("userId", "resourceId");
CREATE INDEX "LessonProgress_userId_status_updatedAt_idx" ON "LessonProgress"("userId", "status", "updatedAt" DESC);
CREATE INDEX "LessonProgress_lessonId_status_idx" ON "LessonProgress"("lessonId", "status");
CREATE UNIQUE INDEX "LessonProgress_userId_lessonId_key" ON "LessonProgress"("userId", "lessonId");
CREATE INDEX "Bookmark_resourceId_idx" ON "Bookmark"("resourceId");
CREATE UNIQUE INDEX "Bookmark_userId_resourceId_key" ON "Bookmark"("userId", "resourceId");

-- AddForeignKey
ALTER TABLE "LearningResource" ADD CONSTRAINT "LearningResource_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LearningResourceCategory" ADD CONSTRAINT "LearningResourceCategory_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "LearningResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningResourceCategory" ADD CONSTRAINT "LearningResourceCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningResourceTag" ADD CONSTRAINT "LearningResourceTag_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "LearningResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningResourceTag" ADD CONSTRAINT "LearningResourceTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "LearningResource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "LearningResource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "LearningResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
