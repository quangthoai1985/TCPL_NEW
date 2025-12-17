
'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle, Download, Eye } from "lucide-react";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/context/DataContext";
import PageHeader from "@/components/layout/page-header";
import type { Indicator, Criterion, Assessment, IndicatorResult } from '@/lib/data';
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AssessmentStatus, FileWithStatus, AssessmentValues } from './types';
import Criterion1Component from "./Criterion1Component";
import RenderBooleanIndicator from "./RenderBooleanIndicator";
import RenderNumberIndicator from "./RenderNumberIndicator";
import RenderPercentageRatioIndicator from "./RenderPercentageRatioIndicator";
import RenderCheckboxGroupIndicator from "./RenderCheckboxGroupIndicator";
import RenderTC1LikeIndicator from "./RenderTC1LikeIndicator";
import RenderTextIndicator from "./RenderTextIndicator";
import RenderGroupHeader from './RenderGroupHeader';
import { cn } from "@/lib/utils";
import StatusBadge from "./StatusBadge";
import RenderCustom343Indicator from "./RenderCustom343Indicator";
import RenderCustom344Indicator from "./RenderCustom344Indicator";

const evaluateStatus = (
    value: any,
    standardLevel: string,
    files: FileWithStatus[],
    isTasked?: boolean | null,
    assignedCount?: number,
    filesPerDocument?: { [documentIndex: number]: FileWithStatus[] },
    inputType?: string,
    indicatorId?: string,
    allAssessmentData?: AssessmentValues // <-- THAM SỐ MỚI
): AssessmentStatus => {

    const LOG_DEBUG = indicatorId?.startsWith('CT1') || indicatorId?.startsWith('CT2') || indicatorId?.startsWith('CT3');
    if (LOG_DEBUG) {
        console.log(`[Eval ${indicatorId}] InputType: ${inputType}, Value: ${value}, Assigned: ${assignedCount}, IsTasked: ${isTasked}, Files: ${files?.length}`);
    }

    if (isTasked === false && indicatorId && (indicatorId.startsWith('CT1.') || indicatorId === 'CT3.1.1' || indicatorId === 'CT3.1.2' || indicatorId === 'CT3.2.1' || indicatorId === 'CT3.2.2' || indicatorId === 'CT2.4.1')) {
        return 'achieved';
    }

    // ==== LOGIC MỚI CHO CT3.4.3 ====
    if (inputType === 'custom_3_4_3') {
        if (!value || typeof value !== 'object') return 'pending';
        const { total, completed, amount } = value;

        // 1. Kiểm tra rỗng
        if (!total || !completed || !amount) return 'pending';

        const nTotal = Number(total);
        const nCompleted = Number(completed);
        const nAmount = Number(amount);

        // 2. Kiểm tra tỷ lệ 100%
        const percentage = nTotal > 0 ? (nCompleted / nTotal) * 100 : 100;
        if (percentage < 100) return 'not-achieved'; // Yêu cầu 100%

        // 3. Kiểm tra số tiền
        const correctAmount = nCompleted * 150000 * 12;
        if (nAmount !== correctAmount) return 'not-achieved';

        // 4. Kiểm tra minh chứng
        if ((files || []).length === 0) return 'not-achieved';

        return 'achieved';
    }

    // ==== LOGIC MỚI CHO CT3.4.4 ====
    if (inputType === 'custom_3_4_4') {
        if (!value || typeof value !== 'object') return 'pending';
        if (!allAssessmentData) return 'pending'; // Cần dữ liệu tổng thể

        const { total, completed, hgt, hgkt, amount } = value;

        // 1. Kiểm tra rỗng
        if (!total || !completed || hgt === undefined || hgkt === undefined || !amount) return 'pending';

        const nTotal = Number(total);
        const nCompleted = Number(completed);
        const nHGT = Number(hgt);
        const nHGKT = Number(hgkt);
        const nAmount = Number(amount);

        // 2. Kiểm tra tỷ lệ 100%
        const percentage = nTotal > 0 ? (nCompleted / nTotal) * 100 : 100;
        if (percentage < 100) return 'not-achieved';

        // 3. Kiểm tra số tiền
        const suggestedAmount = (nHGT * 400000) + (nHGKT * 300000);
        if (nAmount < suggestedAmount) return 'not-achieved';

        // 4. Kiểm tra chéo với CT3.2.2
        const ct322_value = allAssessmentData['CT3.2.2']?.value;
        if (ct322_value && typeof ct322_value === 'object' && ct322_value.completed) {
            const ct322_completed = Number(ct322_value.completed);
            if (nHGT !== ct322_completed) return 'not-achieved'; // Sai số liệu HGT
        } else {
            if (nHGT > 0) return 'not-achieved'; // CT3.2.2 rỗng mà ở đây có số
        }

        // 5. Kiểm tra minh chứng
        if ((files || []).length === 0) return 'not-achieved';

        return 'achieved';
    }

    const isValueEmpty = value === undefined || value === null || value === '' ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'object' && !Array.isArray(value) && value !== null && Object.keys(value).length === 0);

    if (inputType === 'checkbox_group') {
        const checkedCount = (typeof value === 'object' && value !== null)
            ? Object.values(value).filter(v => v === true).length
            : 0;

        if (checkedCount === 0) {
            return 'pending';
        }

        const requiredCountMatch = standardLevel.match(/(\d+)/);
        if (requiredCountMatch) {
            const requiredCount = parseInt(requiredCountMatch[0], 10);
            if (checkedCount < requiredCount) {
                return 'not-achieved';
            }
            if ((files || []).length === 0) {
                return 'not-achieved';
            }
            return 'achieved';
        }
        return 'pending';
    }

    // ==== FORCE STRICT LOGIC FOR CT1, CT2, CT3 ====
    const isStrictLogic = inputType === 'TC1_like' ||
        (typeof indicatorId === 'string' && (indicatorId.startsWith('CT1.') || indicatorId.startsWith('CT2.') || indicatorId.startsWith('CT3.')));

    if (isStrictLogic && inputType !== 'custom_3_4_3' && inputType !== 'custom_3_4_4') {
        const logPrefix = `[Eval ${indicatorId} - STRICT_V4]`; // Version V4

        // 1. Priority: Boolean "False" / "Not Achieved" check
        if (value === false || value === 'false') {
            if (LOG_DEBUG) console.log(`${logPrefix} Fail: Explicit 'Not Achieved' (False) selection`);
            return 'not-achieved';
        }

        // 2. Priority: Empty/Pending Check (FIX FOR FALSE POSITIVES)
        // If value is null, undefined, or empty string, it is PENDING.
        // Do NOT let Number() convert it to 0.
        if (value === null || value === undefined || value === '') {
            if (LOG_DEBUG) console.log(`${logPrefix} Pending: Value is empty/null`);
            return 'pending';
        }

        // 2.1 Special check for empty Objects (if percentage_ratio falls here)
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const vObj = value as any;
            // If object has no meaningful data, treat as pending
            if (!vObj.total && !vObj.completed && !vObj.provided) {
                return 'pending';
            }
        }

        const numValue = Number(value);
        const numAssigned = assignedCount || 0;

        if (LOG_DEBUG) console.log(`${logPrefix} Input: ${numValue}, Required: ${numAssigned}`);

        // 3. Zero check
        // Now safe because we handled "Empty" above. This 0 is a real "User entered 0".
        if (numValue === 0) {
            return numAssigned === 0 ? 'achieved' : 'not-achieved';
        }

        // 4. Quantity check
        if (numValue < numAssigned) {
            if (LOG_DEBUG) console.log(`${logPrefix} Fail: Input < Required`);
            return 'not-achieved';
        }

        // 5. Evidence Check

        // CASE A: CT1.1 (Strict Row-based)
        const isCT1_1 = indicatorId === 'CT1.1';

        if (isCT1_1) {
            for (let i = 0; i < numValue; i++) {
                const docFiles = filesPerDocument?.[i] || filesPerDocument?.[String(i)] || [];
                const validDocFiles = docFiles.filter(f =>
                    (f instanceof File) || (f.url && f.url.trim() !== '') || (f.name && f.name.trim() !== '')
                );

                if (validDocFiles.length === 0) {
                    if (LOG_DEBUG) console.log(`${logPrefix} Fail: Missing evidence at index ${i}`);
                    return 'not-achieved';
                }

                const hasInvalid = validDocFiles.some(f => !(f instanceof File) && (f.signatureStatus === 'invalid' || f.signatureStatus === 'error'));
                if (hasInvalid) return 'not-achieved';

                const hasValidating = validDocFiles.some(f => !(f instanceof File) && f.signatureStatus === 'validating');
                if (hasValidating) return 'pending';
            }
        }
        // CASE B: General Pool Check
        else {
            const flatFilesFromDocs = filesPerDocument ? Object.values(filesPerDocument).flat() : [];
            const allPotentialFiles = [...(files || []), ...flatFilesFromDocs];

            const validFiles = allPotentialFiles.filter(f =>
                (f instanceof File) || (f.url && f.url.trim() !== '') || (f.name && f.name.trim() !== '')
            );

            if (validFiles.length === 0) {
                if (LOG_DEBUG) console.log(`${logPrefix} Fail: No general evidence uploaded`);
                return 'not-achieved';
            }

            const hasInvalid = validFiles.some(f => !(f instanceof File) && (f.signatureStatus === 'invalid' || f.signatureStatus === 'error'));
            if (hasInvalid) return 'not-achieved';

            const hasValidating = validFiles.some(f => !(f instanceof File) && f.signatureStatus === 'validating');
            if (hasValidating) return 'pending';
        }

        return 'achieved';
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const valueObj = value as { total?: string, completed?: string, provided?: string };
        const totalEmpty = valueObj.total === '' || valueObj.total === undefined || valueObj.total === null;
        const completedEmpty = valueObj.completed === '' || valueObj.completed === undefined || valueObj.completed === null;
        const providedEmpty = valueObj.provided === '' || valueObj.provided === undefined || valueObj.provided === null;

        if (totalEmpty || (completedEmpty && providedEmpty)) {
            return 'pending';
        }

        const total = Number(valueObj.total || 0);
        const completed = Number(valueObj.completed || valueObj.provided || 0);

        if (total === 0 && completed === 0 && (files || []).length > 0) return 'achieved';
        if (isNaN(total) || isNaN(completed) || total < 0 || completed < 0 || completed > total) return 'not-achieved';

        const requiredPercentageMatch = standardLevel.match(/(\d+)/);
        if (requiredPercentageMatch) {
            const requiredPercentage = parseInt(requiredPercentageMatch[0], 10);
            const actualPercentage = total > 0 ? (completed / total) * 100 : 100;

            if (actualPercentage < requiredPercentage) {
                return 'not-achieved';
            }

            if ((files || []).length === 0) {
                return 'not-achieved';
            }

            return 'achieved';
        }
        return 'pending';
    }

    if (indicatorId === 'CT2.2' && standardLevel && standardLevel.includes('%') && assignedCount !== undefined) {
        if (assignedCount === 0) {
            return 'achieved';
        }
        const requiredPercentageMatch = standardLevel.match(/(\d+)/);
        if (requiredPercentageMatch) {
            const requiredPercentage = parseInt(requiredPercentageMatch[0], 10);
            const numValue = Number(value);

            if (isNaN(numValue) || value === null || value === undefined || value === '') {
                return 'pending';
            }

            const actualPercentage = (numValue / assignedCount) * 100;

            if (actualPercentage < requiredPercentage) {
                return 'not-achieved';
            }

            if ((files || []).length === 0) {
                return 'not-achieved';
            }

            return 'achieved';
        }
    }

    if (isValueEmpty) {
        return 'pending';
    }

    const hasFileEvidence = (files || []).length > 0 ||
        (filesPerDocument && Object.values(filesPerDocument).some(arr => arr.length > 0));
    if (!hasFileEvidence) {
        if (LOG_DEBUG) console.log(`[Eval ${indicatorId}] Generic -> Fail: No Evidence`, files?.length);
        return 'not-achieved';
    }

    const standard = standardLevel.toLowerCase();

    if (typeof value === 'boolean') {
        const required = standard === 'đạt' || standard === 'true' || standard === 'ban hành đúng thời hạn';
        return value === required ? 'achieved' : 'not-achieved';
    }

    if (!isNaN(Number(value))) {
        const numericValue = Number(value);
        const match = standard.match(/([>=<]+)?\s*(\d+)/);
        if (match) {
            const operator = match[1] || '==';
            const standardValue = parseInt(match[2], 10);
            switch (operator) {
                case '>=': return numericValue >= standardValue ? 'achieved' : 'not-achieved';
                case '>': return numericValue > standardValue ? 'achieved' : 'not-achieved';
                case '<=': return numericValue <= standardValue ? 'achieved' : 'not-achieved';
                case '<': return numericValue < standardValue ? 'achieved' : 'not-achieved';
                case '==': return numericValue === standardValue ? 'achieved' : 'not-achieved';
                default: return 'pending';
            }
        }
    }

    if (typeof value === 'string') {
        return value.toLowerCase().trim() === standard.trim() ? 'achieved' : 'not-achieved';
    }

    return 'pending';
}

const sanitizeDataForFirestore = (data: AssessmentValues): Record<string, IndicatorResult> => {
    const sanitizedData: Record<string, IndicatorResult> = {};
    const sanitizeFiles = (files: FileWithStatus[]) => (files || []).map(f => {
        if (f instanceof File) {
            return { name: f.name, url: '' };
        }
        return {
            name: f.name,
            url: f.url || '',
            signatureStatus: f.signatureStatus || null,
            signatureError: f.signatureError || null,
        };
    });

    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const indicatorData = data[key];

            sanitizedData[key] = {
                isTasked: indicatorData.isTasked === undefined ? null : indicatorData.isTasked,
                value: indicatorData.value === undefined ? null : indicatorData.value,
                note: indicatorData.note || '',
                status: indicatorData.status,
                adminNote: indicatorData.adminNote || '',
                communeNote: indicatorData.communeNote || '',
                files: sanitizeFiles(indicatorData.files || []),
                filesPerDocument: indicatorData.filesPerDocument ? Object.fromEntries(
                    Object.entries(indicatorData.filesPerDocument).map(([idx, fileList]) => [idx, sanitizeFiles(fileList || [])])
                ) : {},
                communeDefinedDocuments: indicatorData.communeDefinedDocuments || null,
            };
        }
    }
    return sanitizedData;
};

export default function SelfAssessmentPage() {
    const router = useRouter();
    const { storage, currentUser, assessmentPeriods, criteria, assessments, updateAssessments, updateSingleAssessment, deleteFileByUrl, functions } = useData();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewFile, setPreviewFile] = useState<{ name: string, url: string } | null>(null);

    const unsavedFilesRef = useRef<string[]>([]);

    const [communeDefinedDocsMap, setCommuneDefinedDocsMap] = useState<Record<string, any[]>>({});

    useEffect(() => {
        return () => {
            if (unsavedFilesRef.current.length > 0) {
                const filesToDelete = [...unsavedFilesRef.current];
                filesToDelete.forEach(async (fileUrl) => {
                    try {
                        await deleteFileByUrl(fileUrl);
                    } catch (error) {
                        console.error(`Lỗi khi dọn dẹp tệp mồ côi ${fileUrl}:`, error);
                    }
                });
                unsavedFilesRef.current = [];
            }
        };
    }, [deleteFileByUrl]);

    const recalculateStatuses = useCallback((data: AssessmentValues, criteria: Criterion[]): AssessmentValues => {
        const nextData = { ...data };

        criteria.forEach(criterion => {
            (criterion.indicators || []).forEach(indicator => {
                const itemData = nextData[indicator.id];
                if (!itemData) return;

                let assignedCount;
                if (indicator.id === 'CT2.2') {
                    const tc01Criterion = criteria.find(c => c.id === 'TC01');
                    const ct1_1_data = nextData['CT1.1'];

                    if (tc01Criterion?.assignmentType === 'specific' && tc01Criterion?.documents && tc01Criterion.documents.length > 0) {
                        assignedCount = tc01Criterion.documents.length;
                    } else if (tc01Criterion?.assignmentType === 'quantity' && tc01Criterion.assignedDocumentsCount && tc01Criterion.assignedDocumentsCount > 0) {
                        assignedCount = tc01Criterion.assignedDocumentsCount;
                    } else {
                        const ct1_1_value = ct1_1_data?.value;
                        if (ct1_1_value && Number(ct1_1_value) > 0) {
                            assignedCount = Number(ct1_1_value);
                        } else if (ct1_1_data?.communeDefinedDocuments && ct1_1_data.communeDefinedDocuments.length > 0) {
                            assignedCount = ct1_1_data.communeDefinedDocuments.length;
                        } else {
                            assignedCount = 0;
                        }
                    }
                } else if (indicator.parentCriterionId === 'TC01') {
                    if (indicator.id === 'CT1.1') {
                        const parentCriterion = criteria.find(c => c.id === 'TC01');
                        if (parentCriterion?.assignmentType === 'quantity') {
                            assignedCount = parentCriterion.assignedDocumentsCount || 0;
                        } else if (parentCriterion?.assignmentType === 'specific') {
                            assignedCount = parentCriterion.documents?.length || 0;
                        }
                    } else {
                        // CT1.2, CT1.3 depend on CT1.1 value
                        const ct1_1_value = nextData['CT1.1']?.value;
                        assignedCount = Number(ct1_1_value) || 0;
                    }
                }

                const status = evaluateStatus(
                    itemData.value,
                    indicator.standardLevel,
                    itemData.files,
                    itemData.isTasked,
                    assignedCount,
                    itemData.filesPerDocument,
                    indicator.inputType,
                    indicator.id,
                    nextData
                );

                if (itemData.status !== status) {
                    nextData[indicator.id] = {
                        ...itemData,
                        status
                    };
                }
            });
        });
        return nextData;
    }, []);

    const initializeState = useCallback((criteria: Criterion[], existingData?: Record<string, IndicatorResult>): AssessmentValues => {
        const initialState: AssessmentValues = {};
        const initialCommuneDocsMap: Record<string, any[]> = {};

        criteria.forEach(criterion => {
            (criterion.indicators || []).forEach(indicator => {
                const savedIndicator = existingData?.[indicator.id];

                if (indicator.inputType === 'TC1_like' && savedIndicator?.communeDefinedDocuments) {
                    initialCommuneDocsMap[indicator.id] = savedIndicator.communeDefinedDocuments;
                }

                initialState[indicator.id] = {
                    isTasked: savedIndicator?.isTasked ?? null,
                    value: savedIndicator?.value ?? '',
                    files: (savedIndicator?.files || []).map(f => ({ ...f, url: f.url || '' })),
                    filesPerDocument: savedIndicator?.filesPerDocument ? Object.fromEntries(
                        Object.entries(savedIndicator.filesPerDocument).map(([k, v]) => [k, (v || []).map(f => ({ ...f, url: f.url || '' }))])
                    ) : {},
                    note: savedIndicator?.note ?? '',
                    status: 'pending', // Temporary, will be recalculated
                    adminNote: savedIndicator?.adminNote ?? '',
                    communeNote: savedIndicator?.communeNote ?? '',
                    communeDefinedDocuments: savedIndicator?.communeDefinedDocuments ?? [],
                };
            });
        });

        setCommuneDefinedDocsMap(initialCommuneDocsMap);
        return recalculateStatuses(initialState, criteria);
    }, [recalculateStatuses]);


    const activePeriod = assessmentPeriods.find(p => p.isActive);
    const myAssessment = activePeriod && currentUser
        ? assessments.find(a => a.assessmentPeriodId === activePeriod.id && a.communeId === currentUser.communeId)
        : undefined;

    const [assessmentData, setAssessmentData] = useState<AssessmentValues>(() => initializeState(criteria, myAssessment?.assessmentData));

    useEffect(() => {
        if (myAssessment?.assessmentData) {
            const newState = initializeState(criteria, myAssessment.assessmentData);
            setAssessmentData(newState);

            const newCommuneDocsMap: Record<string, any[]> = {};
            for (const indicatorId in myAssessment.assessmentData) {
                const indicatorData = myAssessment.assessmentData[indicatorId];
                if (indicatorData.communeDefinedDocuments) {
                    newCommuneDocsMap[indicatorId] = indicatorData.communeDefinedDocuments;
                }
            }
            setCommuneDefinedDocsMap(newCommuneDocsMap);
        }
    }, [myAssessment, criteria, initializeState]);

    const calculateGroupHeaderStatus = useCallback((
        headerIndicatorId: string,
        assessmentData: AssessmentValues,
        criteria: Criterion[]
    ): AssessmentStatus => {
        const headerIndicator = criteria
            .flatMap(c => c.indicators)
            .find(i => i.id === headerIndicatorId);

        if (!headerIndicator?.passRule) return 'pending';

        const childIndicators = criteria
            .flatMap(c => c.indicators)
            .filter(i => i.originalParentIndicatorId === headerIndicatorId);

        if (childIndicators.length === 0) return 'pending';

        const achievedCount = childIndicators.filter(child =>
            assessmentData[child.id]?.status === 'achieved'
        ).length;

        const hasPending = childIndicators.some(child =>
            !assessmentData[child.id] || assessmentData[child.id]?.status === 'pending'
        );

        if (headerIndicator.passRule.type === 'all') {
            if (hasPending) return 'pending';
            return achievedCount === childIndicators.length ? 'achieved' : 'not-achieved';
        } else if (headerIndicator.passRule.type === 'n-of-m') {
            const required = headerIndicator.passRule.required || 0;
            if (achievedCount >= required) return 'achieved';

            const pendingCount = childIndicators.filter(c =>
                !assessmentData[c.id] || assessmentData[c.id]?.status === 'pending'
            ).length;

            if (achievedCount + pendingCount >= required) return 'pending';
            return 'not-achieved';
        }

        return 'pending';
    }, []);

    const calculateCriterionStatus = useCallback((criterion: Criterion): AssessmentStatus => {
        if (!assessmentData || Object.keys(assessmentData).length === 0) {
            return 'pending';
        }

        if (criterion.id === 'TC01') {
            const firstIndicatorId = criterion.indicators[0]?.id;
            if (firstIndicatorId && assessmentData[firstIndicatorId]?.isTasked === false) {
                return 'achieved';
            }
        }

        let hasPending = false;

        for (const indicator of criterion.indicators) {
            if (indicator.inputType === 'group_header') {
                const groupStatus = calculateGroupHeaderStatus(indicator.id, assessmentData, criteria);
                if (groupStatus === 'not-achieved') return 'not-achieved';
                if (groupStatus === 'pending') hasPending = true;
                continue;
            }

            if (indicator.originalParentIndicatorId) {
                continue;
            }

            const status = assessmentData[indicator.id]?.status;
            if (status === 'not-achieved') return 'not-achieved';
            if (!status || status === 'pending') hasPending = true;
        }

        return hasPending ? 'pending' : 'achieved';
    }, [assessmentData, calculateGroupHeaderStatus, criteria]);

    const handleIsTaskedChange = useCallback((id: string, isTasked: boolean) => {
        setAssessmentData(prev => {
            const item = criteria.flatMap(c => c.indicators).find(i => i.id === id);
            if (!item) return prev;

            const newData = { ...prev };

            const indicatorId = id;
            const indicatorData = { ...newData[indicatorId] };

            // Update tasked status directly in local copy first
            indicatorData.isTasked = isTasked;
            if (isTasked) {
                // Restore values if re-tasked (optional, existing logic implied this)
                // But wait, the original logic had `valueToEvaluate`. 
                // We should just update the isTasked flag and let recalculateStatuses handle the rest.
                // Actually, original logic reset files/value if !isTasked.
                if (!isTasked) {
                    indicatorData.value = null;
                    indicatorData.files = [];
                    indicatorData.filesPerDocument = {};
                }
            } else {
                indicatorData.value = null;
                indicatorData.files = [];
                indicatorData.filesPerDocument = {};
            }

            newData[indicatorId] = indicatorData;

            // Recalculate everything to ensure dependencies update
            return recalculateStatuses(newData, criteria);
        });
    }, [criteria, recalculateStatuses]);

    const handleValueChange = useCallback((id: string, value: any) => {
        setAssessmentData(prev => {
            const newData = { ...prev };
            const indicatorData = { ...newData[id] };

            const targetItem = criteria.flatMap(c => c.indicators).find(i => i.id === id);
            if (!targetItem) return prev;

            indicatorData.value = value;

            newData[id] = indicatorData;
            return recalculateStatuses(newData, criteria);
        });
    }, [criteria, recalculateStatuses]);

    const handleCommuneDocsChange = useCallback((indicatorId: string, docs: any[]) => {
        setCommuneDefinedDocsMap(prevMap => ({
            ...prevMap,
            [indicatorId]: docs,
        }));
        setAssessmentData(prev => ({
            ...prev,
            [indicatorId]: {
                ...(prev[indicatorId] || { status: 'pending', value: null, files: [], note: '' }),
                communeDefinedDocuments: docs,
            }
        }));
    }, []);

    const handleNoteChange = useCallback((indicatorId: string, note: string) => {
        setAssessmentData(prev => {
            const newData = { ...prev };
            const indicatorData = { ...newData[indicatorId] };
            indicatorData.note = note;
            newData[indicatorId] = indicatorData;
            return newData;
        });
    }, []);

    const handleEvidenceChange = useCallback(async (indicatorId: string, newFiles: FileWithStatus[], docIndex?: number, fileToRemove?: FileWithStatus) => {
        // --- LOGIC MỚI: Xóa là chỉ update Firestore, để Trigger lo việc xóa file thật ---

        // 1. Tính toán State Mới
        const prev = assessmentData;
        const newData = { ...prev };
        const indicatorData = { ...newData[indicatorId] };
        const targetItem = criteria.flatMap(c => c.indicators).find(i => i.id === indicatorId);

        if (!targetItem) return;

        // Cập nhật danh sách file
        if (docIndex !== undefined) {
            const filesPerDoc = { ...(indicatorData.filesPerDocument || {}) };
            const currentFiles = filesPerDoc[docIndex] || [];
            let updatedFiles;
            if (fileToRemove) {
                updatedFiles = currentFiles.filter(f => f.name !== fileToRemove.name);
            } else {
                updatedFiles = [...currentFiles, ...newFiles];
            }
            // Lọc trùng lặp
            filesPerDoc[docIndex] = updatedFiles.filter((file, index, self) => index === self.findIndex(f => f.name === file.name));
            indicatorData.filesPerDocument = filesPerDoc;
        } else {
            const currentFiles = indicatorData.files || [];
            let updatedFiles;
            if (fileToRemove) {
                updatedFiles = currentFiles.filter(f => f.name !== fileToRemove.name);
            } else {
                updatedFiles = [...currentFiles, ...newFiles];
            }
            // Lọc trùng lặp
            indicatorData.files = updatedFiles.filter((file, index, self) => index === self.findIndex(f => f.name === file.name));
        }

        newData[indicatorId] = indicatorData;

        // TÍNH TOÁN LẠI TRẠNG THÁI NGAY LẬP TỨC
        const recalculatedData = recalculateStatuses(newData, criteria);

        // 2. Cập nhật Local State (CHỈ SET 1 LẦN DUY NHẤT BẰNG DỮ LIỆU ĐÃ TÍNH TOÁN)
        setAssessmentData(recalculatedData);
        // ĐÃ XÓA DÒNG setAssessmentData(newData); GÂY LỖI TẠI ĐÂY

        // 3. Nếu là xóa file, Sync ngay lập tức lên Firestore
        if (fileToRemove) {
            if (!activePeriod || !currentUser) {
                toast({ variant: "destructive", title: "Lỗi", description: "Không thể lưu thay đổi (thiếu thông tin phiên)." });
                return;
            }
            const currentAssessment = assessments.find(a => a.assessmentPeriodId === activePeriod.id && a.communeId === currentUser.communeId);
            if (!currentAssessment) {
                // toast({ variant: "destructive", title: "Lỗi", description: "Không tìm thấy hồ sơ đánh giá." });
                return;
            }

            try {
                toast({ title: "Đang xóa...", description: "Đang cập nhật dữ liệu..." });
                const updatedAssessment: Assessment = {
                    ...currentAssessment,
                    assessmentData: sanitizeDataForFirestore(recalculatedData),
                };
                await updateSingleAssessment(updatedAssessment);
                toast({ title: "Đã xóa", description: "Tệp đã được xóa khỏi hồ sơ." });
            } catch (err) {
                console.error("Lỗi khi sync xóa file:", err);
                toast({ variant: "destructive", title: "Lỗi", description: "Không thể lưu thay đổi xóa file." });
            }
        }

    }, [criteria, assessmentData, activePeriod, currentUser, assessments, updateSingleAssessment, toast, recalculateStatuses]);


    const handleSaveDraft = useCallback(async () => {
        if (!activePeriod || !currentUser || !storage) {
            toast({ variant: 'destructive', title: 'Lỗi', description: 'Không tìm thấy kỳ đánh giá hoặc người dùng.' });
            return;
        }

        setIsSubmitting(true);
        const savingToast = toast({ title: 'Đang lưu nháp...' });

        try {
            const uploadPromises: Promise<void>[] = [];
            const currentUnsavedUrls = [...unsavedFilesRef.current];
            unsavedFilesRef.current = [];

            for (const indicatorId in assessmentData) {
                const indicatorState = assessmentData[indicatorId];

                const processFileList = (files: any[], docIndex?: number) => {
                    files.forEach((file, fileIndex) => {
                        if (file instanceof File) {
                            const promise = async () => {
                                try {
                                    const filePath = docIndex !== undefined
                                        ? `hoso/${currentUser.communeId}/evidence/${activePeriod.id}/${indicatorId}/${docIndex}/${file.name}`
                                        : `hoso/${currentUser.communeId}/evidence/${activePeriod.id}/${indicatorId}/${file.name}`;

                                    const storageRef = ref(storage, filePath);
                                    const snapshot = await uploadBytes(storageRef, file);
                                    const downloadURL = await getDownloadURL(snapshot.ref);

                                    if (docIndex !== undefined) {
                                        assessmentData[indicatorId].filesPerDocument![docIndex][fileIndex] = { name: file.name, url: downloadURL };
                                    } else {
                                        assessmentData[indicatorId].files[fileIndex] = { name: file.name, url: downloadURL };
                                    }
                                } catch (uploadError) {
                                    console.error(`Lỗi khi tải lên file ${file.name}:`, uploadError);
                                    throw new Error(`Failed to upload ${file.name}`);
                                }
                            };
                            uploadPromises.push(promise());
                        }
                    });
                };

                if (indicatorState.filesPerDocument) {
                    for (const docIndex in indicatorState.filesPerDocument) {
                        processFileList(indicatorState.filesPerDocument[docIndex], Number(docIndex));
                    }
                }

                if (indicatorState.files && Object.keys(indicatorState.filesPerDocument || {}).length === 0) {
                    processFileList(indicatorState.files);
                }
            }

            await Promise.all(uploadPromises);

            const currentAssessment = assessments.find(a => a.assessmentPeriodId === activePeriod.id && a.communeId === currentUser.communeId);
            if (!currentAssessment) throw new Error("Không tìm thấy hồ sơ đăng ký hợp lệ.");

            const updatedAssessment: Assessment = {
                ...currentAssessment,
                assessmentStatus: 'draft',
                assessmentData: sanitizeDataForFirestore(assessmentData),
            };

            await updateSingleAssessment(updatedAssessment);

            currentUnsavedUrls.forEach(async (url) => {
                try {
                    await deleteFileByUrl(url);
                } catch (error) {
                }
            });


            savingToast.dismiss();
            toast({
                title: "Lưu nháp thành công!",
                description: "Bạn có thể tiếp tục chỉnh sửa sau.",
            });

        } catch (error) {
            console.error("Lỗi khi lưu nháp:", error);
            savingToast.dismiss();
            toast({
                variant: 'destructive',
                title: 'Lỗi khi lưu nháp',
                description: 'Đã xảy ra lỗi khi tải tệp hoặc lưu dữ liệu.'
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [activePeriod, currentUser, storage, assessmentData, assessments, updateSingleAssessment, toast, deleteFileByUrl]);

    useEffect(() => {
        const hasUnsavedFiles = Object.values(assessmentData).some(indicator =>
            (indicator.files || []).some(f => f instanceof File) ||
            (indicator.filesPerDocument && Object.values(indicator.filesPerDocument).some(list => list.some(f => f instanceof File)))
        );

        if (hasUnsavedFiles) {
            const handler = setTimeout(() => {
                handleSaveDraft();
            }, 5000);

            return () => clearTimeout(handler);
        }
    }, [assessmentData, handleSaveDraft]);

    const { canSubmit, submissionErrors } = useMemo(() => {
        const errors: { label: string, message: string }[] = [];

        criteria.forEach((criterion, cIndex) => {
            // Lấy tên ngắn gọn của tiêu chí (Ví dụ: Tiêu chí 1)
            const criterionLabel = `Tiêu chí ${cIndex + 1}`;

            criterion.indicators.forEach(indicator => {
                // SỬA LỖI QUAN TRỌNG TẠI ĐÂY:
                // Chỉ bỏ qua dòng tiêu đề nhóm ('group_header').
                // ĐÃ XÓA điều kiện "|| indicator.originalParentIndicatorId" để hệ thống KHÔNG bỏ qua các chỉ tiêu con trong nhóm.
                if (indicator.inputType === 'group_header') return;

                const data = assessmentData[indicator.id];

                // 1. Nếu không có dữ liệu hoặc không được giao -> Bỏ qua
                if (!data || data.isTasked === false) return;

                // 2. ƯU TIÊN CAO NHẤT: Nếu trạng thái là "ĐẠT" (achieved) -> Tuyệt đối không báo lỗi.
                // Điều này giải quyết vấn đề "Chỉ tiêu 1" báo lỗi sai dù đã làm đúng.
                if (data.status === 'achieved') return;

                // 3. Nếu Status là "pending" (Chưa chấm) hoặc "not-achieved" (Chưa đạt) -> Phân tích nguyên nhân
                let errorMsg = "";

                // Kiểm tra đã nhập giá trị chưa
                // Lưu ý: data.value = 0 vẫn tính là đã nhập (hasValue = true)
                const hasValue = data.value !== null && data.value !== '' && data.value !== undefined;

                // Kiểm tra đã có file chưa
                const hasFilesCommon = (data.files && data.files.length > 0);
                const hasFilesDoc = data.filesPerDocument && Object.values(data.filesPerDocument).some(arr => arr && arr.length > 0);
                const hasEvidence = hasFilesCommon || hasFilesDoc;

                if (!hasValue) {
                    // Trường hợp này tương ứng với thẻ "Chưa chấm" do chưa nhập gì cả
                    errorMsg = "Chưa nhập số liệu/đánh giá.";
                } else if (indicator.inputType !== 'boolean' && !hasEvidence) {
                    // Đã nhập số nhưng quên file (trừ trường hợp boolean có thể không cần file tùy logic)
                    errorMsg = "Chưa đính kèm minh chứng.";
                } else {
                    // Đã nhập đủ nhưng thuật toán evaluateStatus vẫn trả về chưa đạt
                    // Ví dụ: Nhập 50% nhưng yêu cầu 100%, hoặc file bị lỗi chữ ký, hoặc số tiền không khớp.
                    errorMsg = "Kết quả chưa đạt yêu cầu (kiểm tra lại số liệu hoặc tính hợp lệ của hồ sơ).";
                }

                errors.push({
                    label: `${criterionLabel} - ${indicator.name}`,
                    message: errorMsg
                });
            });
        });

        return { canSubmit: errors.length === 0, submissionErrors: errors };
    }, [assessmentData, criteria]);


    const handleSubmit = async () => {
        if (!activePeriod || !currentUser || !storage) {
            toast({ variant: 'destructive', title: 'Lỗi', description: 'Không tìm thấy kỳ đánh giá, người dùng hoặc dịch vụ lưu trữ.' });
            return;
        }

        setIsSubmitting(true);
        toast({ title: 'Đang gửi hồ sơ...', description: 'Vui lòng chờ trong giây lát.' });

        try {
            await handleSaveDraft();
            const myAssessmentAfterDraft = assessments.find(a => a.assessmentPeriodId === activePeriod.id && a.communeId === currentUser.communeId);

            if (!myAssessmentAfterDraft) {
                toast({ variant: 'destructive', title: 'Lỗi', description: 'Không tìm thấy hồ sơ đăng ký hợp lệ.' });
                setIsSubmitting(false);
                return;
            }

            const updatedAssessment: Assessment = {
                ...myAssessmentAfterDraft,
                assessmentStatus: 'pending_review',
                assessmentSubmissionDate: new Date().toLocaleDateString('vi-VN'),
                submittedBy: currentUser.id,
            };

            await updateSingleAssessment(updatedAssessment);
            unsavedFilesRef.current = [];

            toast({
                title: "Gửi đánh giá thành công!",
                description: "Hồ sơ của bạn đã được gửi đến Admin để xem xét.",
            });

            router.push('/dashboard');

        } catch (error) {
            console.error("Submission error:", error);
            toast({ variant: 'destructive', title: 'Lỗi khi gửi', description: 'Đã xảy ra lỗi khi tải tệp hoặc lưu dữ liệu.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePreview = async (file: { name: string, url: string }) => {
        if (!functions) {
            toast({ variant: "destructive", title: "Lỗi", description: "Dịch vụ Functions chưa sẵn sàng." });
            return;
        }

        // Kiểm tra xem URL có phải là Firebase Storage không
        if (file.url.includes("firebasestorage.googleapis.com")) {
            toast({ title: "Đang tải bản xem trước...", description: "Đang lấy link bảo mật..." });
            try {
                // Extract file path from URL
                // URL format: .../o/path%2Fto%2Ffile?alt=...
                const decodedUrl = decodeURIComponent(file.url);
                const matches = decodedUrl.match(/\/o\/(.*?)\?/);

                if (matches && matches[1]) {
                    const filePath = matches[1];
                    const getSignedUrlFunc = httpsCallable<{ filePath: string }, { signedUrl: string }>(functions, 'getSignedUrlForFile');

                    const result = await getSignedUrlFunc({ filePath });

                    if (result.data.signedUrl) {
                        setPreviewFile({ name: file.name, url: result.data.signedUrl });
                        return;
                    }
                }
            } catch (error) {
                console.error("Lỗi khi lấy signed URL:", error);
                toast({ variant: "destructive", title: "Lỗi xem trước", description: "Không thể tạo link xem trước bảo mật. Đang thử link gốc..." });
            }
        }

        // Fallback or non-firebase file
        setPreviewFile(file);
    };

    if (criteria.length === 0) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                <span>Đang tải bộ tiêu chí...</span>
            </div>
        )
    }

    const totalCriteria = criteria.length;
    const achievedCriteria = criteria.filter(c => calculateCriterionStatus(c) === 'achieved').length;
    const progressPercentage = totalCriteria > 0 ? Math.round((achievedCriteria / totalCriteria) * 100) : 0;

    return (
        <div className="flex flex-col h-[calc(100vh-188px)] overflow-hidden bg-gray-50/50">
            {/* Sticky Header - Now Fixed via Flex */}
            <div className="flex-none bg-background/95 backdrop-blur z-50 border-b shadow-sm px-4 py-3 sm:px-8 mb-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-7xl mx-auto">
                    <div>
                        <h1 className="font-bold text-lg">Đánh giá chuẩn tiếp cận pháp luật</h1>
                        <p className="text-sm text-muted-foreground hidden sm:block">
                            {activePeriod ? `Kỳ: ${activePeriod.name}` : 'Chưa có kỳ đánh giá'}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 flex-1 sm:max-w-md">
                        <div className="flex-1 space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                                <span>Tiến độ hoàn thành</span>
                                <span className={progressPercentage >= 100 ? "text-green-600" : "text-blue-600"}>
                                    {achievedCriteria}/{totalCriteria} tiêu chí ({progressPercentage}%)
                                </span>
                            </div>
                            <Progress value={progressPercentage} className="h-2.5" indicatorClassName={progressPercentage >= 100 ? "bg-green-500" : "bg-primary"} />
                        </div>
                        {canSubmit && (
                            <Button size="sm" onClick={handleSubmit} disabled={isSubmitting} className="shadow-md hidden md:flex">
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Gửi hồ sơ
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content - Scrollable */}
            <div className="flex-1 overflow-y-auto scroll-smooth min-h-0">
                <div className="max-w-5xl mx-auto space-y-8 p-4 sm:p-6 pb-32">

                    {/* Intro Card */}
                    {!activePeriod && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Thông báo</CardTitle>
                                <CardDescription>Hiện tại không có kỳ đánh giá nào đang hoạt động.</CardDescription>
                            </CardHeader>
                        </Card>
                    )}

                    {activePeriod && currentUser && (
                        <div className="grid gap-8">
                            {criteria.map((criterion, index) => {
                                const criterionStatus = calculateCriterionStatus(criterion);

                                // Card Styles based on status
                                const cardBorderColor =
                                    criterionStatus === 'achieved' ? 'border-green-200 shadow-green-100/50' :
                                        criterionStatus === 'not-achieved' ? 'border-red-200 shadow-red-100/50' :
                                            'border-amber-200 shadow-amber-100/50';

                                const headerBgColor =
                                    criterionStatus === 'achieved' ? 'bg-green-100/80 hover:bg-green-100' :
                                        criterionStatus === 'not-achieved' ? 'bg-red-100/80 hover:bg-red-100' :
                                            'bg-amber-100/80 hover:bg-amber-100';


                                if (criterion.id === 'TC01') {
                                    return (
                                        <div key={criterion.id} className="relative">
                                            <div className="absolute -left-3 top-6 bottom-6 w-1 bg-slate-200 rounded-full hidden xl:block"></div>
                                            <Card className={`overflow-hidden transition-all duration-300 hover:shadow-md ${cardBorderColor}`}>
                                                <Accordion type="single" collapsible className="w-full">
                                                    <Criterion1Component
                                                        criterion={criterion}
                                                        criterionStatus={criterionStatus}
                                                        assessmentData={assessmentData}
                                                        onValueChange={handleValueChange}
                                                        onNoteChange={handleNoteChange}
                                                        onEvidenceChange={handleEvidenceChange}
                                                        onIsTaskedChange={handleIsTaskedChange}
                                                        onPreview={handlePreview}
                                                        periodId={activePeriod!.id}
                                                        communeId={currentUser!.communeId}
                                                        handleCommuneDocsChange={handleCommuneDocsChange}
                                                    />
                                                </Accordion>
                                            </Card>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={criterion.id} className="relative">
                                        <div className="absolute -left-3 top-6 bottom-6 w-1 bg-slate-200 rounded-full hidden xl:block"></div>
                                        <Card className={`overflow-hidden transition-all duration-300 hover:shadow-md ${cardBorderColor}`}>
                                            <Accordion type="single" collapsible className="w-full">
                                                <AccordionItem value={criterion.id} className="border-0">
                                                    <AccordionTrigger className={`px-6 py-5 hover:no-underline ${headerBgColor} data-[state=open]:border-b`}>
                                                        <div className="flex items-center gap-4 flex-1 text-left">
                                                            <div className="flex-shrink-0">
                                                                <StatusBadge status={criterionStatus} isCriterion={true} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <h3 className="text-lg font-bold text-foreground">
                                                                    Tiêu chí {index + 1}: {criterion.name.replace(`Tiêu chí ${index + 1}: `, '')}
                                                                </h3>
                                                            </div>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="p-0">
                                                        <div className="p-6 space-y-8">
                                                            {criterion.indicators.map(indicator => {
                                                                if (!assessmentData[indicator.id]) return <div key={indicator.id}>Đang tải dữ liệu...</div>;
                                                                if (indicator.originalParentIndicatorId) return null;

                                                                if (indicator.inputType === 'group_header') {
                                                                    const childIndicators = criterion.indicators.filter(i => i.originalParentIndicatorId === indicator.id);
                                                                    return (
                                                                        <RenderGroupHeader
                                                                            key={indicator.id}
                                                                            headerIndicator={indicator}
                                                                            childIndicators={childIndicators}
                                                                            assessmentData={assessmentData}
                                                                            renderChildComponent={(child) => {
                                                                                const childData = assessmentData[child.id];
                                                                                if (!childData) return null;
                                                                                return (
                                                                                    <div className="pl-4 border-l-2 border-slate-100 mt-4">
                                                                                        {renderIndicator(child, childData)}
                                                                                    </div>
                                                                                );
                                                                            }}
                                                                        />
                                                                    );
                                                                }

                                                                return renderIndicator(indicator, assessmentData[indicator.id]);
                                                            })}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Accordion>
                                        </Card>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Action Buttons (Fixed Bottom Right) */}
            {activePeriod && currentUser && (
                <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 pointer-events-none">

                    {/* Phần thông báo lỗi (Alert) */}
                    {!canSubmit && submissionErrors.length > 0 && (
                        <div className="mb-2 max-w-lg pointer-events-auto">
                            <Alert variant="destructive" className="shadow-xl bg-white/95 backdrop-blur animate-in slide-in-from-right-5 border-red-200">
                                <AlertTriangle className="h-4 w-4 mt-0.5 text-red-600" />
                                <div className="ml-2">
                                    <AlertTitle className="mb-2 font-bold text-red-700">Chưa thể gửi hồ sơ</AlertTitle>
                                    <AlertDescription className="max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                                        <ul className="list-disc pl-4 space-y-2 text-xs text-slate-700">
                                            {submissionErrors.map((err, idx) => (
                                                <li key={idx}>
                                                    <span className="font-semibold block mb-0.5">{err.label}:</span>
                                                    <span className="text-red-600 font-medium">{err.message}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </AlertDescription>
                                </div>
                            </Alert>
                        </div>
                    )}

                    {/* Container chứa 2 nút bấm - Có nền trắng mờ và đổ bóng */}
                    <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md p-2 rounded-full border shadow-2xl pointer-events-auto transition-all hover:scale-105">
                        <Button
                            variant="ghost"
                            onClick={handleSaveDraft}
                            disabled={isSubmitting}
                            className="rounded-full px-4 hover:bg-slate-100 text-slate-600"
                        >
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Lưu nháp
                        </Button>

                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !canSubmit}
                            className="rounded-full px-6 shadow-md"
                        >
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isSubmitting ? 'Đang gửi...' : 'Gửi hồ sơ'}
                        </Button>
                    </div>
                </div>
            )}

            <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle>Xem trước: {previewFile?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 px-6 pb-6 h-full">
                        {previewFile && (
                            <iframe
                                src={`https://docs.google.com/gview?url=${encodeURIComponent(previewFile.url)}&embedded=true`}
                                className="w-full h-full border rounded-md"
                                title={previewFile.name}
                            ></iframe>
                        )}
                    </div>
                    <DialogFooter className="p-6 pt-0 border-t">
                        <Button variant="secondary" asChild>
                            <a href={previewFile?.url} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" /> Tải xuống
                            </a>
                        </Button>
                        <Button variant="outline" onClick={() => setPreviewFile(null)}>Đóng</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );

    function renderIndicator(indicator: any, data: any) {
        if (!data) return null;

        const indicatorStatus = data.status || 'pending';
        const blockClasses = cn(
            'mb-8 last:mb-0 rounded-lg border-2 p-6 transition-colors',
            indicatorStatus === 'achieved' && 'bg-green-50 border-green-200',
            indicatorStatus === 'not-achieved' && 'bg-red-50 border-red-200',
            indicatorStatus === 'pending' && 'bg-amber-50 border-amber-200'
        );

        // Wrapper to add spacing/styling to indicators if needed
        return (
            <div key={indicator.id} className={blockClasses}>
                {(() => {
                    switch (indicator.inputType) {
                        case 'boolean': return <RenderBooleanIndicator indicator={indicator} data={data} onValueChange={handleValueChange} onNoteChange={handleNoteChange} onEvidenceChange={handleEvidenceChange} onPreview={handlePreview} />;
                        case 'number': return <RenderNumberIndicator indicator={indicator} data={data} onValueChange={handleValueChange} onNoteChange={handleNoteChange} onEvidenceChange={handleEvidenceChange} onPreview={handlePreview} criteria={criteria} assessmentData={assessmentData} onIsTaskedChange={handleIsTaskedChange} />;
                        case 'percentage_ratio': return <RenderPercentageRatioIndicator indicator={indicator} data={data} onValueChange={handleValueChange} onNoteChange={handleNoteChange} onEvidenceChange={handleEvidenceChange} onPreview={handlePreview} onIsTaskedChange={handleIsTaskedChange} />;
                        case 'checkbox_group': return <RenderCheckboxGroupIndicator indicator={indicator} data={data} onValueChange={handleValueChange} onNoteChange={handleNoteChange} onEvidenceChange={handleEvidenceChange} onPreview={handlePreview} />;
                        case 'TC1_like': return <RenderTC1LikeIndicator indicator={indicator} data={data} assessmentData={assessmentData} onValueChange={handleValueChange} onNoteChange={handleNoteChange} onEvidenceChange={handleEvidenceChange} onIsTaskedChange={handleIsTaskedChange} onPreview={handlePreview} periodId={activePeriod!.id} communeId={currentUser!.communeId} handleCommuneDocsChange={handleCommuneDocsChange} />;
                        case 'text': return <RenderTextIndicator indicator={indicator} data={data} onValueChange={handleValueChange} onNoteChange={handleNoteChange} onEvidenceChange={handleEvidenceChange} onPreview={handlePreview} />;
                        case 'custom_3_4_3': return <RenderCustom343Indicator indicator={indicator} data={data} onValueChange={handleValueChange} onNoteChange={handleNoteChange} onEvidenceChange={handleEvidenceChange} onPreview={handlePreview} />;
                        case 'custom_3_4_4': return <RenderCustom344Indicator indicator={indicator} data={data} assessmentData={assessmentData} onValueChange={handleValueChange} onNoteChange={handleNoteChange} onEvidenceChange={handleEvidenceChange} onPreview={handlePreview} />;
                        default: return null;
                    }
                })()}
            </div>
        )
    }




}

