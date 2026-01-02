'use server';

import prisma from '@/lib/prisma';

// Helper to format Date to DD/MM/YYYY string
const formatDate = (date: Date | null | undefined): string | undefined => {
    if (!date) return undefined;
    const d = new Date(date);
    if (isNaN(d.getTime())) return undefined;
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Fetch all units (provinces, districts, communes)
 */
export async function getUnits() {
    try {
        const units = await prisma.unit.findMany({
            orderBy: { name: 'asc' },
        });
        return units;
    } catch (error) {
        console.error('Error fetching units:', error);
        return [];
    }
}

/**
 * Fetch all assessment periods
 */
export async function getAssessmentPeriods() {
    try {
        const periods = await prisma.assessmentPeriod.findMany({
            orderBy: { startDate: 'desc' },
        });

        // Convert Dates to strings (DD/MM/YYYY) for frontend compatibility
        return periods.map(period => ({
            ...period,
            startDate: formatDate(period.startDate) || '',
            endDate: formatDate(period.endDate) || '',
            registrationDeadline: formatDate(period.registrationDeadline) || undefined,
        }));
    } catch (error) {
        console.error('Error fetching assessment periods:', error);
        return [];
    }
}

/**
 * Fetch all criteria with their indicators
 */
export async function getCriteria() {
    try {
        const criteria = await prisma.criterion.findMany({
            include: {
                indicators: {
                    orderBy: { order: 'asc' },
                },
            },
            orderBy: { name: 'asc' },
        });
        return criteria;
    } catch (error) {
        console.error('Error fetching criteria:', error);
        return [];
    }
}

/**
 * Fetch assessments for a specific commune
 */
export async function getAssessments(communeId?: string) {
    try {
        const where = communeId ? { communeId } : {};
        const assessments = await prisma.assessment.findMany({
            where,
            include: {
                commune: true,
                period: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Convert Dates to strings
        return assessments.map(assessment => ({
            ...assessment,
            registrationSubmissionDate: formatDate(assessment.registrationSubmissionDate),
            assessmentSubmissionDate: formatDate(assessment.assessmentSubmissionDate),
            approvalDate: formatDate(assessment.approvalDate),
            announcementDate: formatDate(assessment.announcementDate),
        }));
    } catch (error) {
        console.error('Error fetching assessments:', error);
        return [];
    }
}

/**
 * Fetch guidance documents
 */
export async function getGuidanceDocuments() {
    try {
        const documents = await prisma.guidanceDocument.findMany({
            orderBy: { issueDate: 'desc' },
        });

        return documents.map(doc => ({
            ...doc,
            issueDate: formatDate(doc.issueDate) || '',
        }));
    } catch (error) {
        console.error('Error fetching guidance documents:', error);
        return [];
    }
}

/**
 * Fetch all users (admin only)
 */
export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                displayName: true,
                role: true,
                communeId: true,
                phoneNumber: true,
                createdAt: true,
                commune: true,
            },
            orderBy: { displayName: 'asc' },
        });

        return users.map(u => ({
            ...u,
            createdAt: u.createdAt ? u.createdAt.toISOString() : undefined
        }));
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

/**
 * Fetch login config
 */
export async function getLoginConfig() {
    try {
        const config = await prisma.loginConfig.findFirst();
        return config || {};
    } catch (error) {
        console.error('Error fetching login config:', error);
        return {};
    }
}
