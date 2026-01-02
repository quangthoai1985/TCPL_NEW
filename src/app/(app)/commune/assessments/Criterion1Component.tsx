
'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CheckCircle, ListChecks, Settings2, CheckCircle2, XCircle, BarChart3, FileCheck, Clock } from "lucide-react";
import type { Criterion } from "@/lib/data";
import StatusBadge from "./StatusBadge";
import type { AssessmentValues, FileWithStatus, AssessmentStatus } from "./types";
import TC1IndicatorRenderer from './TC1IndicatorRenderer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


const Criterion1Component = ({
    criterion,
    criterionStatus,
    assessmentData,
    onValueChange,
    onNoteChange,
    onEvidenceChange,
    onIsTaskedChange,
    onPreview,
    periodId,
    communeId,
    handleCommuneDocsChange,
}: {
    criterion: Criterion;
    criterionStatus: AssessmentStatus;
    assessmentData: AssessmentValues;
    onValueChange: (id: string, value: any) => void;
    onNoteChange: (id: string, note: string) => void;
    onEvidenceChange: (id: string, files: FileWithStatus[], docIndex?: number, fileToRemove?: FileWithStatus) => void,
    onIsTaskedChange: (id: string, isTasked: boolean) => void;
    onPreview: (file: { name: string; url: string; }) => void;
    periodId: string;
    communeId: string;
    handleCommuneDocsChange: (indicatorId: string, docs: any[]) => void;
}) => {
    const firstIndicatorId = criterion.indicators?.[0]?.id;

    if (!firstIndicatorId || !assessmentData || !assessmentData[firstIndicatorId]) {
        return null;
    }

    const isNotTasked = assessmentData[firstIndicatorId]?.isTasked === false;
    const assignmentType = criterion.assignmentType || 'specific';

    // --- TÍNH TOÁN THỐNG KÊ CHỈ TIÊU ---
    const stats = useMemo(() => {
        // CHỈ TIÊU LỚN: Các chỉ tiêu gốc (không có originalParentIndicatorId)
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
    }, [criterion.indicators, assessmentData]);

    // --- BẮT ĐẦU LOGIC MỚI CHO docsToRender ---
    const docsToRender = useMemo(() => {
        const firstIndicatorData = assessmentData[firstIndicatorId];
        const currentCommuneDocs = firstIndicatorData?.communeDefinedDocuments || [];

        if (assignmentType === 'specific') {
            return criterion.documents || [];
        } else { // assignmentType === 'quantity'
            const adminCount = criterion.assignedDocumentsCount || 0;
            if (adminCount > 0) {
                // Nếu Admin định số lượng, dùng communeDefinedDocs (pad nếu cần)
                return Array.from({ length: adminCount }, (_, i) => currentCommuneDocs[i] || { name: '', issueDate: '', excerpt: '', issuanceDeadlineDays: 30 });
            } else {
                // Nếu Xã tự điền, dùng value từ state cha
                const communeEnteredCount = Number(firstIndicatorData?.value || 0);
                // Dùng communeDefinedDocs hiện có, pad nếu cần
                return Array.from({ length: communeEnteredCount }, (_, i) => currentCommuneDocs[i] || { name: '', issueDate: '', excerpt: '', issuanceDeadlineDays: 30 });
            }
        }
        // Thêm assessmentData[firstIndicatorId] vào dependencies
    }, [assignmentType, criterion.documents, criterion.assignedDocumentsCount, assessmentData[firstIndicatorId]]);
    // --- KẾT THÚC LOGIC MỚI CHO docsToRender ---

    // --- LOGIC MỚI CHO assignedCount ---
    const assignedCount = useMemo(() => {
        // Ưu tiên số lượng Admin đặt, nếu không thì dùng độ dài docsToRender (đã tính theo value xã nhập)
        return criterion.assignedDocumentsCount || (Array.isArray(docsToRender) ? docsToRender.length : 0) || 0;
    }, [criterion.assignedDocumentsCount, docsToRender]);


    const handleNoTaskChange = (checked: boolean | 'indeterminate') => {
        const notTasked = checked === true;
        criterion.indicators.forEach(indicator => {
            onIsTaskedChange(indicator.id, !notTasked);
        });
    };

    const triggerClasses = cn(
        "px-6 py-5 hover:no-underline data-[state=open]:border-b transition-all",
        criterionStatus === 'achieved'
            ? 'bg-gradient-to-r from-green-100/90 to-green-50/50 hover:from-green-100 hover:to-green-100/70'
            : criterionStatus === 'not-achieved'
                ? 'bg-gradient-to-r from-red-100/90 to-red-50/50 hover:from-red-100 hover:to-red-100/70'
                : 'bg-gradient-to-r from-amber-100/90 to-amber-50/50 hover:from-amber-100 hover:to-amber-100/70'
    );


    return (
        <AccordionItem value={criterion.id} key={criterion.id} className="border-0">
            <AccordionTrigger className={triggerClasses}>
                <div className="flex flex-col gap-4 flex-1 text-left w-full">
                    {/* Header Row */}
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                            <StatusBadge status={criterionStatus} isCriterion={true} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-foreground">
                                Tiêu chí 1: {criterion.name.replace(`Tiêu chí 1: `, '')}
                            </h3>
                        </div>
                    </div>

                    {/* Statistics Grid */}
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

                    {/* Progress bar */}
                    <div className="mt-3 space-y-1.5">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500 font-medium">Tiến độ hoàn thành</span>
                            <span className={`font-semibold ${stats.progressPercentage >= 100 ? 'text-green-600' : 'text-blue-600'}`}>
                                {stats.progressPercentage}%
                            </span>
                        </div>
                        <div className="h-2 bg-slate-200/70 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${stats.progressPercentage >= 100 ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-blue-400 to-blue-500'}`}
                                style={{ width: `${stats.progressPercentage}%` }}
                            />
                        </div>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="p-0">
                <div className="p-6 space-y-8">
                    <div className="grid gap-6">
                        <div className="flex items-center space-x-2">
                            <Checkbox id={`${criterion.id}-notask`} checked={isNotTasked} onCheckedChange={handleNoTaskChange} />
                            <Label htmlFor={`${criterion.id}-notask`} className="font-semibold">Xã không được giao nhiệm vụ ban hành VBQPPL trong năm</Label>
                        </div>

                        {isNotTasked && (
                            <Alert variant="default" className="bg-green-50 border-green-300">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertTitle>Đã xác nhận</AlertTitle>
                                <AlertDescription>
                                    Toàn bộ các chỉ tiêu của Tiêu chí 1 được đánh giá là <strong className="text-green-700">Đạt</strong>.
                                </AlertDescription>
                            </Alert>
                        )}

                        {!isNotTasked && (
                            <div className="grid gap-8">
                                <Card className="bg-gradient-to-br from-indigo-50 via-blue-50 to-white border-2 border-indigo-200 shadow-lg overflow-hidden relative">
                                    <CardHeader className="pb-4 border-b border-indigo-100 bg-white/50 backdrop-blur-sm">
                                        <CardTitle className="text-lg text-indigo-700 flex items-center gap-2">
                                            <Settings2 className="w-5 h-5" />
                                            Thông tin nhiệm vụ được giao
                                        </CardTitle>
                                        <CardDescription className="text-indigo-600/80">
                                            {assignmentType === 'specific'
                                                ? "Đây là danh sách các văn bản cụ thể bạn cần ban hành trong kỳ đánh giá này."
                                                : "Vui lòng kê khai thông tin các văn bản đã được ban hành trong kỳ."
                                            }
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {assignmentType === 'quantity' && (!criterion.assignedDocumentsCount || criterion.assignedDocumentsCount === 0) && (
                                            <div className="grid gap-2 p-3 border rounded-md bg-background">
                                                <Label htmlFor="communeDocCount">Tổng số VBQPPL đã ban hành</Label>
                                                <Input
                                                    id="communeDocCount"
                                                    type="number"
                                                    value={assessmentData[firstIndicatorId]?.value || ''}
                                                    onChange={(e) => onValueChange(firstIndicatorId, e.target.value)}
                                                    placeholder="Nhập số lượng"
                                                    className="w-48"
                                                />
                                            </div>
                                        )}
                                        {Array.isArray(docsToRender) && docsToRender.length > 0 ? (
                                            <div className="space-y-3">
                                                {docsToRender.map((doc, index) => (
                                                    <div key={index} className="p-3 border-l-4 border-blue-300 rounded-r-md bg-background text-sm">
                                                        <div className="font-semibold text-primary mb-2">Văn bản {index + 1}{doc.name ? `: ${doc.name}` : ''}</div>
                                                        {assignmentType === 'specific' ? (
                                                            <div className="grid grid-cols-[auto,1fr] gap-x-2 gap-y-1">
                                                                <span className="text-muted-foreground">Trích yếu:</span> <span className="font-medium">{doc.excerpt}</span>
                                                                <span className="text-muted-foreground">Ngày ban hành:</span> <span className="font-medium">{doc.issueDate}</span>
                                                                <span className="text-muted-foreground">Thời hạn:</span> <span className="font-medium"><Badge variant="destructive">{doc.issuanceDeadlineDays} ngày</Badge></span>
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                <div className="grid gap-1.5"><Label htmlFor={`doc-name-${index}`}>Tên VBQPPL</Label><Input id={`doc-name-${index}`} value={doc.name} onChange={(e) => handleCommuneDocsChange(firstIndicatorId, docsToRender.map((d, i) => i === index ? { ...d, name: e.target.value } : d))} /></div>
                                                                <div className="grid gap-1.5"><Label htmlFor={`doc-excerpt-${index}`}>Trích yếu</Label><Input id={`doc-excerpt-${index}`} value={doc.excerpt} onChange={(e) => handleCommuneDocsChange(firstIndicatorId, docsToRender.map((d, i) => i === index ? { ...d, excerpt: e.target.value } : d))} /></div>
                                                                <div className="grid gap-1.5"><Label htmlFor={`doc-issuedate-${index}`}>Ngày ban hành (DD/MM/YYYY)</Label><Input id={`doc-issuedate-${index}`} value={doc.issueDate} onChange={(e) => handleCommuneDocsChange(firstIndicatorId, docsToRender.map((d, i) => i === index ? { ...d, issueDate: e.target.value } : d))} /></div>
                                                                <div className="grid gap-1.5"><Label htmlFor={`doc-deadline-${index}`}>Thời hạn (ngày)</Label><Input type="number" id={`doc-deadline-${index}`} value={doc.issuanceDeadlineDays} onChange={(e) => handleCommuneDocsChange(firstIndicatorId, docsToRender.map((d, i) => i === index ? { ...d, issuanceDeadlineDays: Number(e.target.value) } : d))} /></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p className="text-sm text-muted-foreground">Không có văn bản nào được Admin định danh hoặc xã chưa kê khai.</p>}
                                    </CardContent>
                                </Card>

                                <div className="space-y-8">
                                    {criterion.indicators.map((indicator, indicatorIndex) => {
                                        const data = assessmentData[indicator.id];
                                        if (!data) return <div key={indicator.id}>Đang tải dữ liệu {indicator.name}...</div>;

                                        return (
                                            <TC1IndicatorRenderer
                                                key={indicator.id}
                                                indicator={indicator}
                                                indicatorIndex={indicatorIndex}
                                                data={data}
                                                docsToRender={docsToRender}
                                                assignedCount={assignedCount}
                                                onValueChange={onValueChange}
                                                onNoteChange={onNoteChange}
                                                onEvidenceChange={onEvidenceChange}
                                                onPreview={onPreview}
                                                periodId={periodId}
                                                communeId={communeId}
                                                assessmentData={assessmentData}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

export default Criterion1Component;
