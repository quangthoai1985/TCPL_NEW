'use server';

import prisma from '@/lib/prisma';
import { Unit, Criterion, GuidanceDocument, LoginConfig } from '@/lib/data';
import { revalidatePath } from 'next/cache';

const parseDate = (dateStr?: string): Date | undefined | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
};

// --- Units ---
export async function upsertUnit(unit: Unit): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.unit.upsert({
            where: { id: unit.id },
            create: {
                id: unit.id,
                name: unit.name,
                type: unit.type,
                parentId: unit.parentId,
                address: unit.address,
                headquarters: unit.headquarters,
            },
            update: {
                name: unit.name,
                type: unit.type,
                parentId: unit.parentId,
                address: unit.address,
                headquarters: unit.headquarters,
            }
        });
        revalidatePath('/admin/units');
        return { success: true };
    } catch (error: any) {
        console.error("Upsert unit error:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteUnit(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.unit.delete({ where: { id } });
        revalidatePath('/admin/units');
        return { success: true };
    } catch (error: any) {
        console.error("Delete unit error:", error);
        return { success: false, error: error.message };
    }
}

// --- Criteria ---
export async function upsertCriterion(criterion: Criterion): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.$transaction(async (tx) => {
            // 1. Update Criterion details (or create)
            await tx.criterion.upsert({
                where: { id: criterion.id },
                create: {
                    id: criterion.id,
                    name: criterion.name,
                    description: criterion.description,
                    assignmentType: criterion.assignmentType,
                    assignedDocumentsCount: criterion.assignedDocumentsCount,
                    documents: criterion.documents as any, // Cast JSON
                },
                update: {
                    name: criterion.name,
                    description: criterion.description,
                    assignmentType: criterion.assignmentType,
                    assignedDocumentsCount: criterion.assignedDocumentsCount,
                    documents: criterion.documents as any,
                }
            });

            // 2. Handle Indicators
            // Strategy: Delete all existing and re-create. 
            // This is simplest to ensure order and full sync.
            // CAUTION: This will change IDs if we don't force them.
            // We SHOULD force IDs from the frontend if they exist.

            await tx.indicator.deleteMany({
                where: { parentCriterionId: criterion.id }
            });

            if (criterion.indicators && criterion.indicators.length > 0) {
                await tx.indicator.createMany({
                    data: criterion.indicators.map(ind => ({
                        id: ind.id, // Preserving ID is crucial for historical assessmentData references
                        name: ind.name,
                        description: ind.description,
                        standardLevel: ind.standardLevel,
                        inputType: ind.inputType,
                        evidenceRequirement: ind.evidenceRequirement,
                        order: ind.order || 0,
                        parentCriterionId: criterion.id,
                        originalParentIndicatorId: ind.originalParentIndicatorId || null,
                        templateFiles: ind.templateFiles as any,
                        passRule: ind.passRule as any,
                        assignmentType: ind.assignmentType,
                        assignedDocumentsCount: ind.assignedDocumentsCount,
                        documents: ind.documents as any
                    }))
                });
            }
        });

        revalidatePath('/admin/criteria');
        return { success: true };
    } catch (error: any) {
        console.error("Upsert criterion error:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteCriterion(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.criterion.delete({ where: { id } });
        revalidatePath('/admin/criteria');
        return { success: true };
    } catch (error: any) {
        console.error("Delete criterion error:", error);
        return { success: false, error: error.message };
    }
}

// --- Guidance Documents ---
export async function upsertGuidanceDocument(doc: GuidanceDocument): Promise<{ success: boolean; error?: string }> {
    try {
        const issueDate = parseDate(doc.issueDate) || new Date(); // Fallback if invalid?

        await prisma.guidanceDocument.upsert({
            where: { id: doc.id },
            create: {
                id: doc.id,
                name: doc.name,
                number: doc.number,
                issueDate: issueDate,
                excerpt: doc.excerpt,
                fileUrl: doc.fileUrl
            },
            update: {
                name: doc.name,
                number: doc.number,
                issueDate: issueDate,
                excerpt: doc.excerpt,
                fileUrl: doc.fileUrl
            }
        });
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        console.error("Upsert doc error:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteGuidanceDocument(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.guidanceDocument.delete({ where: { id } });
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        console.error("Delete doc error:", error);
        return { success: false, error: error.message };
    }
}

// --- Login Config ---
export async function updateLoginConfig(config: LoginConfig): Promise<{ success: boolean; error?: string }> {
    try {
        // LoginConfig is a singleton, id usually fixed or searched
        await prisma.loginConfig.upsert({
            where: { id: 'loginPage' }, // Assuming fixed ID for singleton
            create: {
                id: 'loginPage',
                backgroundImageUrl: config.backgroundImageUrl,
                primaryLogoUrl: config.primaryLogoUrl,
                primaryLogoWidth: config.primaryLogoWidth,
                primaryLogoHeight: config.primaryLogoHeight,
                secondaryLogoUrl: config.secondaryLogoUrl,
                secondaryLogoWidth: config.secondaryLogoWidth,
                secondaryLogoHeight: config.secondaryLogoHeight,
            },
            update: {
                backgroundImageUrl: config.backgroundImageUrl,
                primaryLogoUrl: config.primaryLogoUrl,
                primaryLogoWidth: config.primaryLogoWidth,
                primaryLogoHeight: config.primaryLogoHeight,
                secondaryLogoUrl: config.secondaryLogoUrl,
                secondaryLogoWidth: config.secondaryLogoWidth,
                secondaryLogoHeight: config.secondaryLogoHeight,
            }
        });
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error("Update login config error:", error);
        return { success: false, error: error.message };
    }
}
