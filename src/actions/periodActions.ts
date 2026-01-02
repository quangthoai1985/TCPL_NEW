'use server';

import prisma from '@/lib/prisma';
import { AssessmentPeriod } from '@/lib/data';
import { revalidatePath } from 'next/cache';

const parseDate = (dateStr?: string): Date | undefined | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
};

export async function upsertAssessmentPeriod(period: AssessmentPeriod): Promise<{ success: boolean; error?: string }> {
    try {
        const startDate = parseDate(period.startDate);
        const endDate = parseDate(period.endDate);
        const registrationDeadline = parseDate(period.registrationDeadline);

        if (!startDate || !endDate) {
            return { success: false, error: "Định dạng ngày không hợp lệ (DD/MM/YYYY)" };
        }

        // If creating/updating a period to be Active, deactivate all others first
        if (period.isActive) {
            await prisma.assessmentPeriod.updateMany({
                where: { id: { not: period.id } },
                data: { isActive: false }
            });
        }

        await prisma.assessmentPeriod.upsert({
            where: { id: period.id },
            create: {
                id: period.id,
                name: period.name,
                startDate,
                endDate,
                isActive: period.isActive,
                registrationDeadline,
                totalIndicators: period.totalIndicators || 0
            },
            update: {
                name: period.name,
                startDate,
                endDate,
                isActive: period.isActive,
                registrationDeadline,
                totalIndicators: period.totalIndicators
            }
        });

        revalidatePath('/dashboard');
        revalidatePath('/admin/assessment-periods');
        return { success: true };
    } catch (error: any) {
        console.error("Upsert period error:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteAssessmentPeriod(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.assessmentPeriod.delete({ where: { id } });
        revalidatePath('/dashboard');
        revalidatePath('/admin/assessment-periods');
        return { success: true };
    } catch (error: any) {
        console.error("Delete period error:", error);
        return { success: false, error: error.message };
    }
}
