-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "role" TEXT NOT NULL DEFAULT 'commune_staff',
    "communeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentId" TEXT,
    "address" TEXT,
    "headquarters" TEXT,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentPeriod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "registrationDeadline" TIMESTAMP(3),
    "totalIndicators" INTEGER,

    CONSTRAINT "AssessmentPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Criterion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assignmentType" TEXT,
    "assignedDocumentsCount" INTEGER,
    "documents" JSONB,

    CONSTRAINT "Criterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Indicator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "standardLevel" TEXT NOT NULL,
    "inputType" TEXT NOT NULL,
    "evidenceRequirement" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "parentCriterionId" TEXT NOT NULL,
    "originalParentIndicatorId" TEXT,
    "templateFiles" JSONB,
    "passRule" JSONB,
    "assignmentType" TEXT,
    "assignedDocumentsCount" INTEGER,
    "documents" JSONB,

    CONSTRAINT "Indicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "communeId" TEXT NOT NULL,
    "assessmentPeriodId" TEXT NOT NULL,
    "registrationStatus" TEXT NOT NULL DEFAULT 'pending',
    "assessmentStatus" TEXT NOT NULL DEFAULT 'not_started',
    "registrationSubmissionDate" TIMESTAMP(3),
    "assessmentSubmissionDate" TIMESTAMP(3),
    "approvalDate" TIMESTAMP(3),
    "submittedById" TEXT,
    "assessmentData" JSONB,
    "registrationRejectionReason" TEXT,
    "assessmentRejectionReason" TEXT,
    "announcementDecisionUrl" TEXT,
    "announcementDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuidanceDocument" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "excerpt" TEXT NOT NULL,
    "fileUrl" TEXT,

    CONSTRAINT "GuidanceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginConfig" (
    "id" TEXT NOT NULL,
    "backgroundImageUrl" TEXT,
    "primaryLogoUrl" TEXT,
    "primaryLogoWidth" INTEGER,
    "primaryLogoHeight" INTEGER,
    "secondaryLogoUrl" TEXT,
    "secondaryLogoWidth" INTEGER,
    "secondaryLogoHeight" INTEGER,

    CONSTRAINT "LoginConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_communeId_fkey" FOREIGN KEY ("communeId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Indicator" ADD CONSTRAINT "Indicator_parentCriterionId_fkey" FOREIGN KEY ("parentCriterionId") REFERENCES "Criterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_communeId_fkey" FOREIGN KEY ("communeId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_assessmentPeriodId_fkey" FOREIGN KEY ("assessmentPeriodId") REFERENCES "AssessmentPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
