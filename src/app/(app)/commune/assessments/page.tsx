
'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle, Download, Eye, CheckCircle2, Clock, XCircle, BarChart3, ChevronDown, FileCheck } from "lucide-react";
import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";

// Dynamically import PDFViewer to avoid SSR canvas issues
const PDFViewer = dynamic(() => import("@/components/PDFViewer"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Đang tải PDF Viewer...</span>
        </div>
    ),
});
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/context/DataContext";
import PageHeader from "@/components/layout/page-header";
import type { Indicator, Criterion, Assessment, IndicatorResult } from '@/lib/data';
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
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
                const docFiles = (filesPerDocument as any)?.[i] || (filesPerDocument as any)?.[String(i)] || [];
                const validDocFiles = docFiles.filter((f: FileWithStatus) =>
                    (f instanceof File) || (f.url && f.url.trim() !== '') || (f.name && f.name.trim() !== '')
                );

                if (validDocFiles.length === 0) {
                    if (LOG_DEBUG) console.log(`${logPrefix} Fail: Missing evidence at index ${i}`);
                    return 'not-achieved';
                }

                const hasInvalid = validDocFiles.some((f: FileWithStatus) => !(f instanceof File) && (f.signatureStatus === 'invalid' || f.signatureStatus === 'error'));
                if (hasInvalid) return 'not-achieved';

                const hasValidating = validDocFiles.some((f: FileWithStatus) => !(f instanceof File) && f.signatureStatus === 'validating');
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
            previewUrl: f.previewUrl || null, // Preserve preview URL for converted files
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
    const { currentUser, assessmentPeriods, criteria, assessments, updateAssessments, updateAssessment: updateSingleAssessment, deleteFile, uploadFile, getAssessmentPeriod, getCriteria, getAssessments } = useData();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewFile, setPreviewFile] = useState<{ name: string, url: string, previewUrl?: string } | null>(null);

    const unsavedFilesRef = useRef<string[]>([]);

    const [communeDefinedDocsMap, setCommuneDefinedDocsMap] = useState<Record<string, any[]>>({});

    useEffect(() => {
        return () => {
            if (unsavedFilesRef.current.length > 0) {
                const filesToDelete = [...unsavedFilesRef.current];
                filesToDelete.forEach(async (fileUrl) => {
                    try {
                        await deleteFile(fileUrl);
                    } catch (error) {
                        console.error(`Lỗi khi dọn dẹp tệp mồ côi ${fileUrl}:`, error);
                    }
                });
                unsavedFilesRef.current = [];
            }
        };
    }, [deleteFile]);

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

    // Tính toán thống kê chỉ tiêu cho mỗi tiêu chí
    const calculateCriterionStats = useCallback((criterion: Criterion) => {
        // CHỈ TIÊU LỚN: Các chỉ tiêu gốc (không có originalParentIndicatorId)
        // Bao gồm cả group_header và các chỉ tiêu độc lập
        const mainIndicators = criterion.indicators.filter(i => !i.originalParentIndicatorId);
        const mainIndicatorsCount = mainIndicators.length;

        // CHỈ TIÊU CÓ THỂ CHẤM: Tất cả chỉ tiêu KHÔNG phải group_header
        const scoreableIndicators = criterion.indicators.filter(i =>
            i.inputType !== 'group_header'
        );
        const scoreableCount = scoreableIndicators.length;

        let achievedCount = 0;
        let notAchievedCount = 0;
        let pendingCount = 0;

        for (const indicator of scoreableIndicators) {
            const status = assessmentData[indicator.id]?.status;
            if (status === 'achieved') {
                achievedCount++;
            } else if (status === 'not-achieved') {
                notAchievedCount++;
            } else {
                pendingCount++;
            }
        }

        const scoredCount = achievedCount + notAchievedCount;
        const progressPercentage = scoreableCount > 0 ? Math.round((scoredCount / scoreableCount) * 100) : 0;

        return {
            mainIndicatorsCount,  // Số chỉ tiêu lớn
            scoreableCount,       // Số chỉ tiêu có thể chấm
            scoredCount,          // Số đã chấm
            pendingCount,         // Số chưa chấm
            achievedCount,        // Số đạt
            notAchievedCount,     // Số không đạt
            progressPercentage    // Phần trăm tiến độ
        };
    }, [assessmentData]);

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

        // 3. Nếu là xóa file, Sync ngay lập tức lên Firestore VÀ Xóa file khỏi Storage (MinIO)
        if (fileToRemove) {
            if (!activePeriod || !currentUser) {
                toast({ variant: "destructive", title: "Lỗi", description: "Không thể lưu thay đổi (thiếu thông tin phiên)." });
                return;
            }
            const currentAssessment = assessments.find(a => a.assessmentPeriodId === activePeriod.id && a.communeId === currentUser.communeId);
            if (!currentAssessment) {
                return;
            }

            try {
                toast({ title: "Đang xóa...", description: "Đang cập nhật dữ liệu và xóa tệp..." });

                // Cập nhật DB trước
                const updatedAssessment: Assessment = {
                    ...currentAssessment,
                    assessmentData: sanitizeDataForFirestore(recalculatedData),
                };
                await updateSingleAssessment(updatedAssessment);

                // Gọi Server Action xóa file MinIO
                if ('url' in fileToRemove && fileToRemove.url) {
                    await deleteFile(fileToRemove.url);

                    // Also delete the preview file if it exists
                    if ('previewUrl' in fileToRemove && fileToRemove.previewUrl) {
                        try {
                            await deleteFile(fileToRemove.previewUrl);
                            console.log('Preview file deleted:', fileToRemove.previewUrl);
                        } catch (previewErr) {
                            console.warn('Could not delete preview file:', previewErr);
                            // Don't fail if preview deletion fails
                        }
                    }
                }

                toast({ title: "Đã xóa", description: "Tệp đã được xóa hoàn toàn." });
            } catch (err) {
                console.error("Lỗi khi sync xóa file:", err);
                toast({ variant: "destructive", title: "Lỗi", description: "Không thể lưu thay đổi xóa file." });
            }
        }

    }, [criteria, assessmentData, activePeriod, currentUser, assessments, updateSingleAssessment, toast, recalculateStatuses]);


    const handleSaveDraft = useCallback(async () => {
        if (!activePeriod || !currentUser) {
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
                                    // Determine config for verification
                                    let issueDate = '';
                                    let issuanceDeadlineDays = '';

                                    // Find parent criterion
                                    const criterion = criteria.find(c => (c.indicators || []).some(i => i.id === indicatorId));

                                    if (criterion && docIndex !== undefined) {
                                        // Logic to get doc config
                                        // This is simplified but should cover TC1 and TC2.4.1 logic
                                        // Priority: 1. Specific Config (Admin) 2. Commune Defined (User Input)

                                        const assignmentType = criterion.assignmentType || 'specific';

                                        if (assignmentType === 'specific') {
                                            const docConfig = criterion.documents?.[docIndex];
                                            if (docConfig?.issueDate) {
                                                issueDate = docConfig.issueDate;
                                                issuanceDeadlineDays = String(docConfig.issuanceDeadlineDays || 7);
                                            }
                                        } else {
                                            // quantity (User Defined)
                                            // Need to find communeDefinedDocuments for this indicator
                                            // assessmentData object holds current values
                                            const currentIndicatorData = assessmentData[indicatorId];
                                            const communeDocs = currentIndicatorData?.communeDefinedDocuments;
                                            const userDoc = communeDocs?.[docIndex];

                                            if (userDoc?.issueDate) {
                                                issueDate = userDoc.issueDate;
                                                issuanceDeadlineDays = String(userDoc.issuanceDeadlineDays || 30);
                                            }
                                        }
                                    }

                                    // Upload and Verify
                                    const result = await uploadFile(
                                        file,
                                        currentUser.communeId!,
                                        activePeriod.id,
                                        indicatorId,
                                        issueDate,
                                        issuanceDeadlineDays
                                    );

                                    // Update State with verification result
                                    const newFileObj: FileWithStatus = {
                                        name: file.name,
                                        url: result.url,
                                        signatureStatus: result.signatureStatus as any, // Cast to any to avoid union type mismatch with FileWithStatus temporarily
                                        signatureError: result.signatureError,
                                        previewUrl: result.previewUrl // Add preview URL for converted files
                                    };

                                    if (docIndex !== undefined) {
                                        (assessmentData[indicatorId].filesPerDocument as Record<number, (File | FileWithStatus)[]>)[docIndex][fileIndex] = newFileObj;
                                    } else {
                                        assessmentData[indicatorId].files[fileIndex] = newFileObj;
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
                    await deleteFile(url);
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
    }, [activePeriod, currentUser, assessmentData, assessments, updateSingleAssessment, toast, deleteFile]);

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
        if (!activePeriod || !currentUser) {
            toast({ variant: 'destructive', title: 'Lỗi', description: 'Không tìm thấy kỳ đánh giá hoặc người dùng.' });
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

    const handlePreview = async (file: { name: string, url: string, previewUrl?: string }) => {
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-[1600px] mx-auto">
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
                <div className="max-w-[1600px] mx-auto space-y-8 p-4 sm:p-6 pb-32">

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
                            {[...criteria].sort((a, b) => a.id.localeCompare(b.id)).map((criterion, index) => {
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
                                        <div key={criterion.id} className="relative w-full">
                                            <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 min-h-[200px] w-full ${criterionStatus === 'achieved'
                                                ? 'border-green-300 shadow-lg shadow-green-100/60 bg-gradient-to-br from-white to-green-50/30'
                                                : criterionStatus === 'not-achieved'
                                                    ? 'border-red-300 shadow-lg shadow-red-100/60 bg-gradient-to-br from-white to-red-50/30'
                                                    : 'border-amber-300 shadow-lg shadow-amber-100/60 bg-gradient-to-br from-white to-amber-50/30'
                                                }`}>
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
                                    <div key={criterion.id} className="relative w-full">
                                        <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 min-h-[200px] w-full ${criterionStatus === 'achieved'
                                            ? 'border-green-300 shadow-lg shadow-green-100/60 bg-gradient-to-br from-white to-green-50/30'
                                            : criterionStatus === 'not-achieved'
                                                ? 'border-red-300 shadow-lg shadow-red-100/60 bg-gradient-to-br from-white to-red-50/30'
                                                : 'border-amber-300 shadow-lg shadow-amber-100/60 bg-gradient-to-br from-white to-amber-50/30'
                                            }`}>
                                            <Accordion type="single" collapsible className="w-full">
                                                <AccordionItem value={criterion.id} className="border-0">
                                                    <AccordionTrigger className={`px-6 py-5 hover:no-underline data-[state=open]:border-b transition-all ${criterionStatus === 'achieved'
                                                        ? 'bg-gradient-to-r from-green-100/90 to-green-50/50 hover:from-green-100 hover:to-green-100/70'
                                                        : criterionStatus === 'not-achieved'
                                                            ? 'bg-gradient-to-r from-red-100/90 to-red-50/50 hover:from-red-100 hover:to-red-100/70'
                                                            : 'bg-gradient-to-r from-amber-100/90 to-amber-50/50 hover:from-amber-100 hover:to-amber-100/70'
                                                        }`}>
                                                        <div className="flex flex-col gap-4 flex-1 text-left w-full">
                                                            {/* Header Row */}
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex-shrink-0">
                                                                    <StatusBadge status={criterionStatus} isCriterion={true} />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h3 className="text-lg font-bold text-foreground">
                                                                        Tiêu chí {criterion.id.replace('TC', '').replace(/^0+/, '')}: {criterion.name.replace(/^Tiêu chí \d+[:.]\s*/i, '')}
                                                                    </h3>
                                                                </div>
                                                            </div>

                                                            {/* Statistics Grid */}
                                                            {(() => {
                                                                const stats = calculateCriterionStats(criterion);
                                                                return (
                                                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
                                                                        {/* Chỉ tiêu lớn */}
                                                                        <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-lg px-2.5 py-2 shadow-sm border border-slate-200/50">
                                                                            <div className="p-1.5 rounded-md bg-indigo-100">
                                                                                <BarChart3 className="w-4 h-4 text-indigo-600" />
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[10px] text-slate-500 font-medium">Chỉ tiêu lớn</span>
                                                                                <span className="text-sm font-bold text-slate-700">{stats.mainIndicatorsCount}</span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Có thể chấm */}
                                                                        <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-lg px-2.5 py-2 shadow-sm border border-blue-200/50">
                                                                            <div className="p-1.5 rounded-md bg-blue-100">
                                                                                <FileCheck className="w-4 h-4 text-blue-600" />
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[10px] text-slate-500 font-medium">Có thể chấm</span>
                                                                                <span className="text-sm font-bold text-blue-600">{stats.scoreableCount}</span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Đã chấm */}
                                                                        <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-lg px-2.5 py-2 shadow-sm border border-purple-200/50">
                                                                            <div className="p-1.5 rounded-md bg-purple-100">
                                                                                <Clock className="w-4 h-4 text-purple-600" />
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[10px] text-slate-500 font-medium">Đã chấm</span>
                                                                                <span className="text-sm font-bold text-purple-600">{stats.scoredCount}/{stats.scoreableCount}</span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Đạt */}
                                                                        <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-lg px-2.5 py-2 shadow-sm border border-green-200/50">
                                                                            <div className="p-1.5 rounded-md bg-green-100">
                                                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[10px] text-slate-500 font-medium">Đạt</span>
                                                                                <span className="text-sm font-bold text-green-600">{stats.achievedCount}</span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Không đạt */}
                                                                        <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-lg px-2.5 py-2 shadow-sm border border-red-200/50">
                                                                            <div className="p-1.5 rounded-md bg-red-100">
                                                                                <XCircle className="w-4 h-4 text-red-600" />
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[10px] text-slate-500 font-medium">Không đạt</span>
                                                                                <span className="text-sm font-bold text-red-600">{stats.notAchievedCount}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()}

                                                            {/* Progress bar */}
                                                            {(() => {
                                                                const stats = calculateCriterionStats(criterion);
                                                                return (
                                                                    <div className="mt-3 space-y-1.5">
                                                                        <div className="flex justify-between text-xs">
                                                                            <span className="text-slate-500 font-medium">Tiến độ hoàn thành</span>
                                                                            <span className={`font-semibold ${stats.progressPercentage >= 100 ? 'text-green-600' : 'text-blue-600'
                                                                                }`}>
                                                                                {stats.progressPercentage}%
                                                                            </span>
                                                                        </div>
                                                                        <div className="h-2 bg-slate-200/70 rounded-full overflow-hidden">
                                                                            <div
                                                                                className={`h-full rounded-full transition-all duration-500 ${stats.progressPercentage >= 100 ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-blue-400 to-blue-500'
                                                                                    }`}
                                                                                style={{ width: `${stats.progressPercentage}%` }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()}
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
                                                                                    <div className="mt-2">
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

                    {/* Phần thông báo lỗi (Alert) - Thu gọn thành icon, hover để mở */}
                    {!canSubmit && submissionErrors.length > 0 && (
                        <div className="mb-2 pointer-events-auto group relative">
                            {/* Icon thu gọn - luôn hiển thị */}
                            <div className="w-12 h-12 rounded-full bg-red-500 shadow-xl flex items-center justify-center cursor-pointer animate-pulse hover:animate-none transition-all hover:scale-110">
                                <AlertTriangle className="h-6 w-6 text-white" />
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-red-600 rounded-full text-xs font-bold flex items-center justify-center shadow-md">
                                    {submissionErrors.length}
                                </span>
                            </div>

                            {/* Panel mở rộng khi hover */}
                            <div className="absolute bottom-0 right-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                                <Alert variant="destructive" className="w-96 max-w-[90vw] shadow-2xl bg-white/98 backdrop-blur-md border-red-300 animate-in slide-in-from-right-5">
                                    <AlertTriangle className="h-4 w-4 mt-0.5 text-red-600" />
                                    <div className="ml-2">
                                        <AlertTitle className="mb-2 font-bold text-red-700">Chưa thể gửi hồ sơ ({submissionErrors.length} lỗi)</AlertTitle>
                                        <AlertDescription className="max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
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

            <Sheet open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
                <SheetContent side="right" className="w-full sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl p-0 flex flex-col">
                    <SheetHeader className="p-4 pb-2 border-b shrink-0">
                        <SheetTitle className="truncate pr-8">Xem trước: {previewFile?.name}</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-hidden min-h-0">
                        {previewFile && (() => {
                            const targetUrl = previewFile.previewUrl || previewFile.url;
                            const isPdf = previewFile.previewUrl ||
                                previewFile.name.toLowerCase().endsWith('.pdf') ||
                                targetUrl.toLowerCase().split('?')[0].endsWith('.pdf');

                            if (isPdf) {
                                const pdfSrc = `/api/preview?url=${encodeURIComponent(targetUrl)}&t=${new Date().getTime()}`;
                                return <PDFViewer url={pdfSrc} className="w-full h-full" />;
                            }

                            // Fallback to Google Docs Viewer for other file types
                            return (
                                <iframe
                                    src={`https://docs.google.com/gview?url=${encodeURIComponent(targetUrl)}&embedded=true`}
                                    className="w-full h-full border rounded-md"
                                    title={previewFile.name}
                                />
                            );
                        })()}
                    </div>
                    <SheetFooter className="p-4 pt-2 border-t shrink-0">
                        <Button variant="secondary" asChild>
                            <a href={previewFile?.url} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" /> Tải xuống
                            </a>
                        </Button>
                        <Button variant="outline" onClick={() => setPreviewFile(null)}>Đóng</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );

    function renderIndicator(indicator: any, data: any) {
        if (!data) return null;

        const indicatorStatus = data.status || 'pending';
        // Reduced margin-bottom and padding for a tighter, cleaner look
        const blockClasses = cn(
            'mb-4 last:mb-0 rounded-lg border-2 p-4 transition-colors shadow-sm w-full max-w-full overflow-hidden',
            indicatorStatus === 'achieved' && 'bg-green-50 border-green-300',
            indicatorStatus === 'not-achieved' && 'bg-red-50 border-red-300',
            indicatorStatus === 'pending' && 'bg-amber-50 border-amber-300'
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

