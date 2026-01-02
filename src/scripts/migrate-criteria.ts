
import * as admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient();
const serviceAccountPath = path.resolve(process.cwd(), 'chuan-tiep-can-pl-firebase-adminsdk-fbsvc-060cb2990b.json');
const serviceAccount = require(serviceAccountPath);

// Prevent multiple initializations
if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function main() {
    console.log('Start migrating Criteria...');
    const criteriaSnap = await db.collection('criteria').get();

    for (const doc of criteriaSnap.docs) {
        const cData = doc.data();
        const criterionId = doc.id;
        console.log(`Processing Criterion: ${criterionId} - ${cData.name || 'No Name'}`);

        // Map Criterion Data
        const criterionData = {
            name: cData.name || '',
            description: cData.description || '',
            assignmentType: cData.assignmentType || null,
            assignedDocumentsCount: typeof cData.assignedDocumentsCount === 'number' ? cData.assignedDocumentsCount : null,
            documents: cData.documents || [], // Json
        };

        await prisma.criterion.upsert({
            where: { id: criterionId },
            update: criterionData,
            create: {
                id: criterionId,
                ...criterionData
            }
        });

        // Fetch Indicators Subcollection
        const indicatorsSnap = await db.collection('criteria').doc(criterionId).collection('indicators').get();

        // Also check if indicators are stored as array in the doc itself (legacy/alternative structure)
        let indicatorsList: any[] = [];
        if (!indicatorsSnap.empty) {
            indicatorsList = indicatorsSnap.docs.map(d => ({ ...d.data(), id: d.id }));
        } else if (Array.isArray(cData.indicators)) {
            indicatorsList = cData.indicators;
        }

        if (indicatorsList.length > 0) {
            console.log(`  Found ${indicatorsList.length} indicators.`);

            // Delete existing indicators for this criterion to ensure fresh state (optional but safer for clean sync)
            // await prisma.indicator.deleteMany({ where: { parentCriterionId: criterionId } });
            // NOTE: upsert is safer if we want to preserve other relations, but for migration simple update is fine.

            for (const ind of indicatorsList) {
                const indId = ind.id || `IND_${Date.now()}_${Math.random()}`;

                const indData = {
                    name: ind.name || '',
                    description: ind.description || '',
                    standardLevel: ind.standardLevel || '',
                    inputType: ind.inputType || 'boolean',
                    evidenceRequirement: ind.evidenceRequirement || null,
                    order: typeof ind.order === 'number' ? ind.order : 0,
                    originalParentIndicatorId: ind.originalParentIndicatorId || null,

                    templateFiles: ind.templateFiles || [],
                    passRule: ind.passRule || null,
                    assignmentType: ind.assignmentType || null,
                    assignedDocumentsCount: typeof ind.assignedDocumentsCount === 'number' ? ind.assignedDocumentsCount : null,
                    documents: ind.documents || [],
                };

                await prisma.indicator.upsert({
                    where: { id: indId },
                    update: {
                        ...indData,
                        parentCriterionId: criterionId
                    },
                    create: {
                        id: indId,
                        parentCriterionId: criterionId,
                        ...indData
                    }
                });
            }
        } else {
            console.log(`  No indicators found.`);
        }
    }
    console.log('Migration completed.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
        // admin.app().delete(); // Exit firebase
    });
