'use server';

import prisma from '@/lib/prisma';
import { Assessment } from '@/lib/data';
import { revalidatePath } from 'next/cache';

const parseDate = (dateStr?: string): Date | undefined | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
};

export async function upsertAssessment(assessment: Assessment): Promise<{ success: boolean; error?: string }> {
    try {
        console.log(`Upserting assessment: ${assessment.id}`);

        // Map frontend strings back to Date objects
        const registrationSubmissionDate = parseDate(assessment.registrationSubmissionDate);
        const assessmentSubmissionDate = parseDate(assessment.assessmentSubmissionDate);
        const approvalDate = parseDate(assessment.approvalDate);
        const announcementDate = parseDate(assessment.announcementDate);

        // Prisma Upsert
        await prisma.assessment.upsert({
            where: { id: assessment.id },
            update: {
                registrationStatus: assessment.registrationStatus,
                assessmentStatus: assessment.assessmentStatus,
                registrationSubmissionDate: registrationSubmissionDate,
                assessmentSubmissionDate: assessmentSubmissionDate,
                approvalDate: approvalDate,
                announcementDate: announcementDate,
                registrationFormUrl: assessment.registrationFormUrl,
                assessmentData: assessment.assessmentData ?? {},
            },
            create: {
                id: assessment.id,
                communeId: assessment.communeId,
                assessmentPeriodId: assessment.assessmentPeriodId,
                registrationStatus: assessment.registrationStatus,
                assessmentStatus: assessment.assessmentStatus,
                registrationSubmissionDate: registrationSubmissionDate,
                assessmentSubmissionDate: assessmentSubmissionDate,
                approvalDate: approvalDate,
                announcementDate: announcementDate,
                registrationFormUrl: assessment.registrationFormUrl,
                assessmentData: assessment.assessmentData ?? {},
                submittedById: assessment.submittedBy, // Fixed: use scalar field submittedById
            }
        });

        revalidatePath('/dashboard');
        revalidatePath('/commune/assessments');
        revalidatePath('/admin/registrations');

        return { success: true };
    } catch (error: any) {
        console.error("Upsert assessment error:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteAssessment(assessmentId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.assessment.delete({ where: { id: assessmentId } });

        revalidatePath('/dashboard');
        revalidatePath('/commune/assessments');
        revalidatePath('/admin/registrations');

        return { success: true };
    } catch (error: any) {
        console.error("Delete assessment error:", error);
        return { success: false, error: error.message };
    }
}
